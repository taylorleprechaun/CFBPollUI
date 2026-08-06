using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class TeamPredictionRecordModuleTests
{
    private readonly Mock<IPersistentCache> _mockCache;
    private readonly Mock<IOptions<CacheOptions>> _mockCacheOptions;
    private readonly Mock<ILogger<TeamPredictionRecordModule>> _mockLogger;
    private readonly Mock<IPredictionsModule> _mockPredictionsModule;
    private readonly TeamPredictionRecordModule _module;

    public TeamPredictionRecordModuleTests()
    {
        _mockCache = new Mock<IPersistentCache>();
        _mockCacheOptions = new Mock<IOptions<CacheOptions>>();
        _mockCacheOptions.Setup(x => x.Value).Returns(new CacheOptions());
        _mockLogger = new Mock<ILogger<TeamPredictionRecordModule>>();
        _mockPredictionsModule = new Mock<IPredictionsModule>();

        _module = new TeamPredictionRecordModule(
            _mockCache.Object,
            _mockCacheOptions.Object,
            _mockLogger.Object,
            _mockPredictionsModule.Object);
    }

    [Fact]
    public void Constructor_NullCache_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new TeamPredictionRecordModule(
                null!,
                _mockCacheOptions.Object,
                _mockLogger.Object,
                _mockPredictionsModule.Object));
    }

    [Fact]
    public void Constructor_NullCacheOptions_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new TeamPredictionRecordModule(
                _mockCache.Object,
                null!,
                _mockLogger.Object,
                _mockPredictionsModule.Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new TeamPredictionRecordModule(
                _mockCache.Object,
                _mockCacheOptions.Object,
                null!,
                _mockPredictionsModule.Object));
    }

    [Fact]
    public void Constructor_NullPredictionsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new TeamPredictionRecordModule(
                _mockCache.Object,
                _mockCacheOptions.Object,
                _mockLogger.Object,
                null!));
    }

    [Fact]
    public async Task GetTeamRecordsAsync_CacheHit_ReturnsWithoutComputation()
    {
        var cached = new List<TeamPredictionRecord> { new() { TeamName = "Michigan", PredictedWins = 5 } };

        _mockCache
            .Setup(x => x.GetAsync<List<TeamPredictionRecord>>("team-prediction-records_2024"))
            .ReturnsAsync(cached);

        var result = await _module.GetTeamRecordsAsync(2024);

        Assert.Equal(cached, result);
        _mockPredictionsModule.Verify(x => x.GetAllSummariesAsync(), Times.Never);
    }

    [Fact]
    public async Task GetTeamRecordsAsync_CacheMiss_StoresResult()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>());
        _mockCache
            .Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<List<TeamPredictionRecord>>(), It.IsAny<DateTime>()))
            .ReturnsAsync(true);

        await _module.GetTeamRecordsAsync(2024);

        _mockCache.Verify(
            x => x.SetAsync("team-prediction-records_2024", It.IsAny<List<TeamPredictionRecord>>(), It.IsAny<DateTime>()),
            Times.Once);
    }

    [Fact]
    public async Task GetTeamRecordsAsync_ExcludesUngradedAndNotApplicableFromActualTally()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 1, IsPublished = true, IsGraded = true, ResultsPublished = true }
        });

        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 1)).ReturnsAsync(new PredictionsResult
        {
            Season = 2024,
            Week = 1,
            Predictions = new List<GamePrediction>
            {
                new()
                {
                    HomeTeam = "Iowa",
                    AwayTeam = "Nebraska",
                    PredictedWinner = "Iowa",
                    ActualWinner = null,
                    WinnerGrade = PredictionGradeStatus.NotApplicable
                }
            }
        });

        var result = (await _module.GetTeamRecordsAsync(2024)).ToDictionary(r => r.TeamName);

        var iowa = result["Iowa"];
        Assert.Equal(1, iowa.PredictedWins);
        Assert.Equal(0, iowa.GradedGameCount);
        Assert.Equal(0, iowa.ActualWins);
        Assert.Equal(0, iowa.ActualLosses);

        var nebraska = result["Nebraska"];
        Assert.Equal(1, nebraska.PredictedLosses);
        Assert.Equal(0, nebraska.GradedGameCount);
        Assert.Equal(0, nebraska.ActualWins);
        Assert.Equal(0, nebraska.ActualLosses);
    }

    [Fact]
    public async Task GetTeamRecordsAsync_FiltersToRequestedSeasonOnly()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { Season = 2023, Week = 1, IsPublished = true, IsGraded = true, ResultsPublished = true }
        });

        var result = await _module.GetTeamRecordsAsync(2024);

        Assert.Empty(result);
        _mockPredictionsModule.Verify(x => x.GetAsync(2023, 1), Times.Never);
    }

    [Fact]
    public async Task GetTeamRecordsAsync_MissingPredictionsForGradedSummary_SkipsWeek()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 1, IsPublished = true, IsGraded = true, ResultsPublished = true }
        });

        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 1)).ReturnsAsync((PredictionsResult?)null);

        var result = await _module.GetTeamRecordsAsync(2024);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetTeamRecordsAsync_NoSummaries_ReturnsEmpty()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>());

        var result = await _module.GetTeamRecordsAsync(2024);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetTeamRecordsAsync_OrdersResultsByTeamName()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 1, IsPublished = true, IsGraded = true, ResultsPublished = true }
        });

        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 1)).ReturnsAsync(new PredictionsResult
        {
            Season = 2024,
            Week = 1,
            Predictions = new List<GamePrediction>
            {
                new() { HomeTeam = "Texas", AwayTeam = "Alabama", PredictedWinner = "Texas" }
            }
        });

        var result = await _module.GetTeamRecordsAsync(2024);

        var teamNames = result.Select(r => r.TeamName).ToList();
        Assert.Equal(new List<string> { "Alabama", "Texas" }, teamNames);
    }

    [Fact]
    public async Task GetTeamRecordsAsync_SkipsUnpublishedOrUngradedSummaries()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 1, IsPublished = false, IsGraded = true, ResultsPublished = true },
            new() { Season = 2024, Week = 2, IsPublished = true, IsGraded = false, ResultsPublished = true },
            new() { Season = 2024, Week = 3, IsPublished = true, IsGraded = true, ResultsPublished = false }
        });

        var result = await _module.GetTeamRecordsAsync(2024);

        Assert.Empty(result);
        _mockPredictionsModule.Verify(x => x.GetAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetTeamRecordsAsync_TalliesPredictedAndActualWinLossPerTeamAcrossWeeks()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 1, IsPublished = true, IsGraded = true, ResultsPublished = true },
            new() { Season = 2024, Week = 2, IsPublished = true, IsGraded = true, ResultsPublished = true }
        });

        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 1)).ReturnsAsync(new PredictionsResult
        {
            Season = 2024,
            Week = 1,
            Predictions = new List<GamePrediction>
            {
                new()
                {
                    HomeTeam = "Michigan",
                    AwayTeam = "Ohio State",
                    PredictedWinner = "Michigan",
                    ActualWinner = "Ohio State",
                    WinnerGrade = PredictionGradeStatus.Incorrect
                }
            }
        });

        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 2)).ReturnsAsync(new PredictionsResult
        {
            Season = 2024,
            Week = 2,
            Predictions = new List<GamePrediction>
            {
                new()
                {
                    HomeTeam = "Alabama",
                    AwayTeam = "Michigan",
                    PredictedWinner = "Michigan",
                    ActualWinner = "Michigan",
                    WinnerGrade = PredictionGradeStatus.Correct
                }
            }
        });

        var result = (await _module.GetTeamRecordsAsync(2024)).ToDictionary(r => r.TeamName);

        var michigan = result["Michigan"];
        Assert.Equal(2, michigan.PredictedWins);
        Assert.Equal(0, michigan.PredictedLosses);
        Assert.Equal(1, michigan.ActualWins);
        Assert.Equal(1, michigan.ActualLosses);
        Assert.Equal(2, michigan.GradedGameCount);

        var ohioState = result["Ohio State"];
        Assert.Equal(0, ohioState.PredictedWins);
        Assert.Equal(1, ohioState.PredictedLosses);
        Assert.Equal(1, ohioState.ActualWins);
        Assert.Equal(0, ohioState.ActualLosses);
        Assert.Equal(1, ohioState.GradedGameCount);

        var alabama = result["Alabama"];
        Assert.Equal(0, alabama.PredictedWins);
        Assert.Equal(1, alabama.PredictedLosses);
        Assert.Equal(0, alabama.ActualWins);
        Assert.Equal(1, alabama.ActualLosses);
        Assert.Equal(1, alabama.GradedGameCount);
    }

    [Fact]
    public async Task GetTeamRecordsAsync_UsesFirstNonEmptyLogoURLSeenForTeam()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 1, IsPublished = true, IsGraded = true, ResultsPublished = true },
            new() { Season = 2024, Week = 2, IsPublished = true, IsGraded = true, ResultsPublished = true }
        });

        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 1)).ReturnsAsync(new PredictionsResult
        {
            Season = 2024,
            Week = 1,
            Predictions = new List<GamePrediction>
            {
                new() { HomeTeam = "Michigan", HomeLogoURL = "", AwayTeam = "Ohio State", AwayLogoURL = "ohio-state.png", PredictedWinner = "Michigan" }
            }
        });

        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 2)).ReturnsAsync(new PredictionsResult
        {
            Season = 2024,
            Week = 2,
            Predictions = new List<GamePrediction>
            {
                new() { HomeTeam = "Michigan", HomeLogoURL = "michigan-week2.png", AwayTeam = "Alabama", AwayLogoURL = "", PredictedWinner = "Michigan" }
            }
        });

        var result = (await _module.GetTeamRecordsAsync(2024)).ToDictionary(r => r.TeamName);

        Assert.Equal("michigan-week2.png", result["Michigan"].LogoURL);
        Assert.Equal("ohio-state.png", result["Ohio State"].LogoURL);
        Assert.Equal(string.Empty, result["Alabama"].LogoURL);
    }

    [Fact]
    public async Task InvalidateCacheAsync_DelegatesToCache()
    {
        _mockCache.Setup(x => x.RemoveByPrefixAsync("team-prediction-records_")).ReturnsAsync(1);

        await _module.InvalidateCacheAsync();

        _mockCache.Verify(x => x.RemoveByPrefixAsync("team-prediction-records_"), Times.Once);
    }
}
