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

public class TrackRecordModuleTests
{
    private readonly Mock<IPersistentCache> _mockCache;
    private readonly Mock<IOptions<CacheOptions>> _mockCacheOptions;
    private readonly Mock<ILogger<TrackRecordModule>> _mockLogger;
    private readonly Mock<IPredictionsModule> _mockPredictionsModule;
    private readonly TrackRecordModule _module;

    public TrackRecordModuleTests()
    {
        _mockCache = new Mock<IPersistentCache>();
        _mockCacheOptions = new Mock<IOptions<CacheOptions>>();
        _mockCacheOptions.Setup(x => x.Value).Returns(new CacheOptions());
        _mockLogger = new Mock<ILogger<TrackRecordModule>>();
        _mockPredictionsModule = new Mock<IPredictionsModule>();

        _module = new TrackRecordModule(
            _mockCache.Object,
            _mockCacheOptions.Object,
            _mockLogger.Object,
            _mockPredictionsModule.Object);
    }

    [Fact]
    public void Constructor_NullCacheOptions_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new TrackRecordModule(
                _mockCache.Object,
                null!,
                _mockLogger.Object,
                _mockPredictionsModule.Object));
    }

    [Fact]
    public void Constructor_NullCache_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new TrackRecordModule(
                null!,
                _mockCacheOptions.Object,
                _mockLogger.Object,
                _mockPredictionsModule.Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new TrackRecordModule(
                _mockCache.Object,
                _mockCacheOptions.Object,
                null!,
                _mockPredictionsModule.Object));
    }

    [Fact]
    public void Constructor_NullPredictionsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new TrackRecordModule(
                _mockCache.Object,
                _mockCacheOptions.Object,
                _mockLogger.Object,
                null!));
    }

    [Fact]
    public async Task GetTrackRecordAsync_CacheHit_ReturnsWithoutComputation()
    {
        var cachedResult = new TrackRecordResult
        {
            OverallWinner = new TrackRecordTotals { Correct = 5 }
        };

        _mockCache
            .Setup(x => x.GetAsync<TrackRecordResult>("track-record_all"))
            .ReturnsAsync(cachedResult);

        var result = await _module.GetTrackRecordAsync();

        Assert.Equal(cachedResult, result);
        _mockPredictionsModule.Verify(x => x.GetAllSummariesAsync(), Times.Never);
    }

    [Fact]
    public async Task GetTrackRecordAsync_CacheMiss_StoresResult()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>());
        _mockCache
            .Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<TrackRecordResult>(), It.IsAny<DateTime>()))
            .ReturnsAsync(true);

        await _module.GetTrackRecordAsync();

        _mockCache.Verify(
            x => x.SetAsync("track-record_all", It.IsAny<TrackRecordResult>(), It.IsAny<DateTime>()),
            Times.Once);
    }

    [Fact]
    public async Task GetTrackRecordAsync_ExcludesUngradedAndNotApplicableFromTallies()
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
                    WinnerGrade = PredictionGradeStatus.Ungraded,
                    SpreadGrade = PredictionGradeStatus.NotApplicable,
                    OverUnderGrade = PredictionGradeStatus.NotApplicable
                }
            }
        });

        var result = await _module.GetTrackRecordAsync();

        var week = Assert.Single(result.Weeks);
        Assert.Equal(0, week.Winner.Correct + week.Winner.Incorrect + week.Winner.Push);
        Assert.Equal(0, week.Spread.Correct + week.Spread.Incorrect + week.Spread.Push);
        Assert.Equal(0, week.OverUnder.Correct + week.OverUnder.Incorrect + week.OverUnder.Push);
        Assert.Equal(0, week.MarginGameCount);
        Assert.Null(week.MarginRMSE);
        Assert.Null(week.MarginBias);
    }

    [Fact]
    public async Task GetTrackRecordAsync_GradedGamesWithBothPredictedWinnerDirections_ComputesMarginRMSEAndBias()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 3, IsPublished = true, IsGraded = true, ResultsPublished = true }
        });

        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 3)).ReturnsAsync(new PredictionsResult
        {
            Season = 2024,
            Week = 3,
            Predictions = new List<GamePrediction>
            {
                new()
                {
                    HomeTeam = "Michigan",
                    AwayTeam = "Ohio State",
                    PredictedWinner = "Michigan",
                    PredictedMargin = 7,
                    ActualHomeScore = 24,
                    ActualAwayScore = 17
                },
                new()
                {
                    HomeTeam = "Texas",
                    AwayTeam = "Oklahoma",
                    PredictedWinner = "Oklahoma",
                    PredictedMargin = 3,
                    ActualHomeScore = 20,
                    ActualAwayScore = 24
                }
            }
        });

        var result = await _module.GetTrackRecordAsync();

        var week = Assert.Single(result.Weeks);
        Assert.Equal(2, week.MarginGameCount);
        Assert.Equal(0.5, week.MarginBias);
        Assert.Equal(0.7071, week.MarginRMSE!.Value, precision: 4);

        Assert.Equal(0.5, result.OverallMarginBias);
        Assert.Equal(0.7071, result.OverallMarginRMSE!.Value, precision: 4);
    }

    [Fact]
    public async Task GetTrackRecordAsync_MissingPredictionsForGradedSummary_SkipsWeek()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 1, IsPublished = true, IsGraded = true, ResultsPublished = true }
        });

        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 1)).ReturnsAsync((PredictionsResult?)null);

        var result = await _module.GetTrackRecordAsync();

        Assert.Empty(result.Weeks);
    }

    [Fact]
    public async Task GetTrackRecordAsync_NoSummaries_ReturnsEmptyResult()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>());

        var result = await _module.GetTrackRecordAsync();

        Assert.Empty(result.Weeks);
        Assert.Equal(0, result.OverallWinner.Correct);
        Assert.Equal(0, result.OverallSpread.Correct);
        Assert.Equal(0, result.OverallOverUnder.Correct);
        Assert.Null(result.OverallMarginRMSE);
        Assert.Null(result.OverallMarginBias);
    }

    [Fact]
    public async Task GetTrackRecordAsync_OrdersWeeksBySeasonThenWeek()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 3, IsPublished = true, IsGraded = true, ResultsPublished = true },
            new() { Season = 2023, Week = 5, IsPublished = true, IsGraded = true, ResultsPublished = true },
            new() { Season = 2024, Week = 1, IsPublished = true, IsGraded = true, ResultsPublished = true }
        });

        _mockPredictionsModule.Setup(x => x.GetAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync((int season, int week) => new PredictionsResult
            {
                Season = season,
                Week = week,
                Predictions = []
            });

        var result = await _module.GetTrackRecordAsync();

        var weeks = result.Weeks.ToList();
        Assert.Equal(3, weeks.Count);
        Assert.Equal((2023, 5), (weeks[0].Season, weeks[0].Week));
        Assert.Equal((2024, 1), (weeks[1].Season, weeks[1].Week));
        Assert.Equal((2024, 3), (weeks[2].Season, weeks[2].Week));
    }

    [Fact]
    public async Task GetTrackRecordAsync_SkipsUnpublishedOrUngradedSummaries()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 1, IsPublished = false, IsGraded = true, ResultsPublished = true },
            new() { Season = 2024, Week = 2, IsPublished = true, IsGraded = false, ResultsPublished = true },
            new() { Season = 2024, Week = 3, IsPublished = true, IsGraded = true, ResultsPublished = false }
        });

        var result = await _module.GetTrackRecordAsync();

        Assert.Empty(result.Weeks);
        _mockPredictionsModule.Verify(x => x.GetAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetTrackRecordAsync_TalliesCorrectIncorrectAndPushPerCategory()
    {
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 3, IsPublished = true, IsGraded = true, ResultsPublished = true }
        });

        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 3)).ReturnsAsync(new PredictionsResult
        {
            Season = 2024,
            Week = 3,
            Predictions = new List<GamePrediction>
            {
                new()
                {
                    HomeTeam = "Michigan",
                    AwayTeam = "Ohio State",
                    WinnerGrade = PredictionGradeStatus.Correct,
                    SpreadGrade = PredictionGradeStatus.Incorrect,
                    OverUnderGrade = PredictionGradeStatus.Push
                },
                new()
                {
                    HomeTeam = "Texas",
                    AwayTeam = "Oklahoma",
                    WinnerGrade = PredictionGradeStatus.Incorrect,
                    SpreadGrade = PredictionGradeStatus.Correct,
                    OverUnderGrade = PredictionGradeStatus.Correct
                }
            }
        });

        var result = await _module.GetTrackRecordAsync();

        var week = Assert.Single(result.Weeks);
        Assert.Equal(2024, week.Season);
        Assert.Equal(3, week.Week);
        Assert.Equal(1, week.Winner.Correct);
        Assert.Equal(1, week.Winner.Incorrect);
        Assert.Equal(1, week.Spread.Correct);
        Assert.Equal(1, week.Spread.Incorrect);
        Assert.Equal(1, week.OverUnder.Correct);
        Assert.Equal(1, week.OverUnder.Push);

        Assert.Equal(1, result.OverallWinner.Correct);
        Assert.Equal(1, result.OverallWinner.Incorrect);
        Assert.Equal(1, result.OverallSpread.Correct);
        Assert.Equal(1, result.OverallSpread.Incorrect);
        Assert.Equal(1, result.OverallOverUnder.Correct);
        Assert.Equal(1, result.OverallOverUnder.Push);
    }

    [Fact]
    public async Task InvalidateCacheAsync_DelegatesToCache()
    {
        _mockCache.Setup(x => x.RemoveByPrefixAsync("track-record_")).ReturnsAsync(1);

        await _module.InvalidateCacheAsync();

        _mockCache.Verify(x => x.RemoveByPrefixAsync("track-record_"), Times.Once);
    }
}
