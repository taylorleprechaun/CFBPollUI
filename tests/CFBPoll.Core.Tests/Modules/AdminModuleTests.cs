using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class AdminModuleTests
{
    private readonly AdminModule _adminModule;
    private readonly Mock<IPersistentCache> _mockCache;
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<IExcelExportModule> _mockExcelExportModule;
    private readonly Mock<ILogger<AdminModule>> _mockLogger;
    private readonly Mock<IPollLeadersModule> _mockPollLeadersModule;
    private readonly Mock<IPredictionAlgorithmResolver> _mockPredictionAlgorithmResolver;
    private readonly Mock<IPredictionCalculatorModule> _mockPredictionCalculatorModule;
    private readonly Mock<IPredictionGradingModule> _mockPredictionGradingModule;
    private readonly Mock<IPredictionsModule> _mockPredictionsModule;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<IRatingAlgorithmResolver> _mockRatingAlgorithmResolver;
    private readonly Mock<IRatingModule> _mockRatingModule;
    private readonly Mock<ISeasonModule> _mockSeasonModule;
    private readonly Mock<ISeasonTrendsModule> _mockSeasonTrendsModule;
    private readonly Mock<ITeamPredictionRecordModule> _mockTeamPredictionRecordModule;
    private readonly Mock<ITrackRecordModule> _mockTrackRecordModule;

    public AdminModuleTests()
    {
        _mockCache = new Mock<IPersistentCache>();
        _mockDataService = new Mock<ICFBDataService>();
        _mockExcelExportModule = new Mock<IExcelExportModule>();
        _mockLogger = new Mock<ILogger<AdminModule>>();
        _mockPollLeadersModule = new Mock<IPollLeadersModule>();
        _mockPredictionCalculatorModule = new Mock<IPredictionCalculatorModule>();
        _mockPredictionAlgorithmResolver = new Mock<IPredictionAlgorithmResolver>();
        _mockPredictionAlgorithmResolver.Setup(x => x.ResolveForSeason(It.IsAny<int>())).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(It.IsAny<RatingAlgorithmVersion>())).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionAlgorithmResolver.Setup(x => x.ResolveVersionForSeason(It.IsAny<int>())).Returns(RatingAlgorithmVersion.V1);
        _mockPredictionGradingModule = new Mock<IPredictionGradingModule>();
        _mockPredictionsModule = new Mock<IPredictionsModule>();
        _mockRankingsModule = new Mock<IRankingsModule>();
        _mockRatingModule = new Mock<IRatingModule>();
        _mockRatingAlgorithmResolver = new Mock<IRatingAlgorithmResolver>();
        _mockRatingAlgorithmResolver.Setup(x => x.ResolveForPredictions()).Returns(_mockRatingModule.Object);
        _mockRatingAlgorithmResolver.Setup(x => x.ResolveForSeason(It.IsAny<int>())).Returns(_mockRatingModule.Object);
        _mockRatingAlgorithmResolver.Setup(x => x.ResolveVersionForSeason(It.IsAny<int>())).Returns(RatingAlgorithmVersion.V1);
        _mockRatingAlgorithmResolver.Setup(x => x.Resolve(It.IsAny<RatingAlgorithmVersion>())).Returns(_mockRatingModule.Object);
        _mockSeasonModule = new Mock<ISeasonModule>();
        _mockSeasonTrendsModule = new Mock<ISeasonTrendsModule>();
        _mockTeamPredictionRecordModule = new Mock<ITeamPredictionRecordModule>();
        _mockTrackRecordModule = new Mock<ITrackRecordModule>();

        _mockDataService.Setup(x => x.GetBettingLinesAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(new List<BettingLine>());

        _adminModule = new AdminModule(
            _mockDataService.Object,
            _mockExcelExportModule.Object,
            _mockCache.Object,
            _mockPollLeadersModule.Object,
            _mockPredictionAlgorithmResolver.Object,
            _mockPredictionGradingModule.Object,
            _mockPredictionsModule.Object,
            _mockRankingsModule.Object,
            _mockRatingAlgorithmResolver.Object,
            _mockSeasonModule.Object,
            _mockSeasonTrendsModule.Object,
            _mockTeamPredictionRecordModule.Object,
            _mockTrackRecordModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task CalculateExperimentalAsync_BypassesSeasonDefaultVersion()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        var mockV2 = new Mock<IRatingModule>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);
        mockV2.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRatingAlgorithmResolver.Setup(x => x.Resolve(RatingAlgorithmVersion.V2)).Returns(mockV2.Object);
        _mockRatingAlgorithmResolver.Setup(x => x.ResolveVersionForSeason(2024)).Returns(RatingAlgorithmVersion.V1);

        var result = await _adminModule.CalculateExperimentalAsync(2024, 5, RatingAlgorithmVersion.V2);

        Assert.Equal(RatingAlgorithmVersion.V2, result.AlgorithmVersion);
        mockV2.Verify(x => x.RateTeamsAsync(seasonData), Times.Once);
        _mockRatingModule.Verify(x => x.RateTeamsAsync(It.IsAny<SeasonData>()), Times.Never);
    }

    [Fact]
    public async Task CalculateExperimentalAsync_NeverPersistsSnapshot()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        await _adminModule.CalculateExperimentalAsync(2024, 5, RatingAlgorithmVersion.V1);

        _mockRankingsModule.Verify(
            x => x.SaveSnapshotAsync(It.IsAny<RankingsResult>(), It.IsAny<RatingAlgorithmVersion>()), Times.Never);
    }

    [Fact]
    public async Task CalculateExperimentalPredictionsAsync_GradesAgainstActualScores_ReturnsSummary()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Texas"] = new(),
            ["Oklahoma"] = new()
        };
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Texas", AwayTeam = "Oklahoma" }
        };
        var predictions = new List<GamePrediction>
        {
            new() { HomeTeam = "Texas", AwayTeam = "Oklahoma", PredictedWinner = "Texas", PredictedMargin = 7 }
        };
        var completedGames = new List<Game>
        {
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Texas", AwayTeam = "Oklahoma", HomePoints = 30, AwayPoints = 20 }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockDataService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync(completedGames);
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(RatingAlgorithmVersion.V2)).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(predictions);

        var result = await _adminModule.CalculateExperimentalPredictionsAsync(2024, 5, RatingAlgorithmVersion.V2);

        Assert.Equal(RatingAlgorithmVersion.V2, result.AlgorithmVersion);
        Assert.Equal(1, result.Summary.GradedGameCount);
        Assert.Equal(1, result.Summary.Winner.Correct);
        var graded = Assert.Single(result.Predictions);
        Assert.Equal(30, graded.ActualHomeScore);
        Assert.Equal(20, graded.ActualAwayScore);
    }

    [Fact]
    public async Task CalculateExperimentalPredictionsAsync_NeverPersistsAnything()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockDataService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync(new List<Game>());
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(RatingAlgorithmVersion.V1)).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculateExperimentalPredictionsAsync(2024, 5, RatingAlgorithmVersion.V1);

        _mockPredictionsModule.Verify(x => x.SaveAsync(It.IsAny<PredictionsResult>()), Times.Never);
    }

    [Fact]
    public async Task CalculateExperimentalPredictionsAsync_NoCompletedGames_ReturnsZeroGradedGameCount()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Iowa"] = new(),
            ["Nebraska"] = new()
        };
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Iowa", AwayTeam = "Nebraska" }
        };
        var predictions = new List<GamePrediction>
        {
            new() { HomeTeam = "Iowa", AwayTeam = "Nebraska", PredictedWinner = "Iowa" }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockDataService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync(new List<Game>());
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(RatingAlgorithmVersion.V2)).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(predictions);

        var result = await _adminModule.CalculateExperimentalPredictionsAsync(2024, 5, RatingAlgorithmVersion.V2);

        Assert.Equal(0, result.Summary.GradedGameCount);
        Assert.Null(result.Predictions.Single().ActualHomeScore);
    }

    [Fact]
    public async Task CalculateExperimentalPredictionsAsync_UsesExplicitlyRequestedAlgorithmVersion()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockDataService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync(new List<Game>());
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(RatingAlgorithmVersion.V2)).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculateExperimentalPredictionsAsync(2024, 5, RatingAlgorithmVersion.V2);

        _mockPredictionAlgorithmResolver.Verify(x => x.Resolve(RatingAlgorithmVersion.V2), Times.Once);
        _mockPredictionAlgorithmResolver.Verify(x => x.ResolveForSeason(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task CalculateExperimentalSeasonPredictionsAsync_EmptyWeeksList_ReturnsEmptyWeeksAndZeroGradedGameCount()
    {
        var result = await _adminModule.CalculateExperimentalSeasonPredictionsAsync(2024, [], RatingAlgorithmVersion.V1);

        Assert.Empty(result.Weeks);
        Assert.Equal(0, result.OverallSummary.GradedGameCount);
    }

    [Fact]
    public async Task CalculateExperimentalSeasonPredictionsAsync_ManyWeeks_LimitsConcurrentCalculations()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Michigan"] = new(),
            ["Nebraska"] = new()
        };
        var weekNumbers = new[] { 1, 2, 3, 4, 5, 6 };
        var concurrentCalls = 0;
        var maxObservedConcurrency = 0;
        var gate = new object();

        foreach (var week in weekNumbers)
        {
            _mockDataService
                .Setup(x => x.GetSeasonDataAsync(2024, week))
                .Returns(async () =>
                {
                    lock (gate)
                    {
                        concurrentCalls++;
                        maxObservedConcurrency = Math.Max(maxObservedConcurrency, concurrentCalls);
                    }

                    await Task.Delay(50);

                    lock (gate)
                    {
                        concurrentCalls--;
                    }

                    return new SeasonData { Season = 2024, Week = week, Teams = fbsTeams };
                });
        }

        _mockRatingModule.Setup(x => x.RateTeamsAsync(It.IsAny<SeasonData>())).ReturnsAsync(new Dictionary<string, RatingDetails>());
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockDataService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync(new List<Game>());
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(RatingAlgorithmVersion.V1)).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(It.IsAny<SeasonData>(), It.IsAny<IDictionary<string, RatingDetails>>(), It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculateExperimentalSeasonPredictionsAsync(2024, weekNumbers, RatingAlgorithmVersion.V1);

        Assert.True(maxObservedConcurrency <= 4, $"Expected at most 4 concurrent week calculations, but observed {maxObservedConcurrency}.");
    }

    [Fact]
    public async Task CalculateExperimentalSeasonPredictionsAsync_MultipleWeeks_AggregatesOverallSummaryAcrossAllWeeks()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Ohio State"] = new(),
            ["Michigan"] = new(),
            ["Notre Dame"] = new(),
            ["USC"] = new()
        };
        var weekFiveSeasonData = new SeasonData { Season = 2024, Week = 5, Teams = fbsTeams };
        var weekSixSeasonData = new SeasonData { Season = 2024, Week = 6, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Ohio State", AwayTeam = "Michigan" },
            new() { Week = 7, SeasonType = "regular", HomeTeam = "Notre Dame", AwayTeam = "USC" }
        };
        var weekFivePredictions = new List<GamePrediction>
        {
            new() { HomeTeam = "Ohio State", AwayTeam = "Michigan", PredictedWinner = "Ohio State", PredictedMargin = 7 }
        };
        var weekSixPredictions = new List<GamePrediction>
        {
            new() { HomeTeam = "Notre Dame", AwayTeam = "USC", PredictedWinner = "Notre Dame", PredictedMargin = 3 }
        };
        var completedGames = new List<Game>
        {
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Ohio State", AwayTeam = "Michigan", HomePoints = 28, AwayPoints = 14 },
            new() { Week = 7, SeasonType = "regular", HomeTeam = "Notre Dame", AwayTeam = "USC", HomePoints = 24, AwayPoints = 21 }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(weekFiveSeasonData);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 6)).ReturnsAsync(weekSixSeasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(It.IsAny<SeasonData>())).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockDataService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync(completedGames);
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(RatingAlgorithmVersion.V2)).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(weekFiveSeasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(weekFivePredictions);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(weekSixSeasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(weekSixPredictions);

        var result = await _adminModule.CalculateExperimentalSeasonPredictionsAsync(2024, [5, 6], RatingAlgorithmVersion.V2);

        Assert.Equal(2, result.OverallSummary.GradedGameCount);
        Assert.Equal(2, result.OverallSummary.Winner.Correct);
    }

    [Fact]
    public async Task CalculateExperimentalSeasonPredictionsAsync_MultipleWeeks_WarmsSeasonLevelCachesBeforeFanningOutPerWeek()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Iowa"] = new(),
            ["Nebraska"] = new()
        };
        var weekFiveSeasonData = new SeasonData { Season = 2024, Week = 5, Teams = fbsTeams };
        var weekSixSeasonData = new SeasonData { Season = 2024, Week = 6, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(weekFiveSeasonData);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 6)).ReturnsAsync(weekSixSeasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(It.IsAny<SeasonData>())).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockDataService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync(new List<Game>());
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(RatingAlgorithmVersion.V1)).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(It.IsAny<SeasonData>(), ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculateExperimentalSeasonPredictionsAsync(2024, [5, 6], RatingAlgorithmVersion.V1);

        _mockDataService.Verify(x => x.GetFullSeasonScheduleAsync(2024), Times.AtLeastOnce);
        _mockDataService.Verify(x => x.GetSeasonDataAsync(2024, 5), Times.AtLeastOnce);
    }

    [Fact]
    public async Task CalculateExperimentalSeasonPredictionsAsync_NeverPersistsAnything()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockDataService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync(new List<Game>());
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(RatingAlgorithmVersion.V1)).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculateExperimentalSeasonPredictionsAsync(2024, [5], RatingAlgorithmVersion.V1);

        _mockPredictionsModule.Verify(x => x.SaveAsync(It.IsAny<PredictionsResult>()), Times.Never);
    }

    [Fact]
    public async Task CalculateExperimentalSeasonPredictionsAsync_NullWeeks_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _adminModule.CalculateExperimentalSeasonPredictionsAsync(2024, null!, RatingAlgorithmVersion.V1));
    }

    [Fact]
    public async Task CalculateExperimentalSeasonPredictionsAsync_ReturnsPerWeekBreakdownOrderedByWeekRegardlessOfInputOrder()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Alabama"] = new(),
            ["Florida"] = new()
        };
        var weekFiveSeasonData = new SeasonData { Season = 2024, Week = 5, Teams = fbsTeams };
        var weekSixSeasonData = new SeasonData { Season = 2024, Week = 6, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(weekFiveSeasonData);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 6)).ReturnsAsync(weekSixSeasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(It.IsAny<SeasonData>())).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockDataService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync(new List<Game>());
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(RatingAlgorithmVersion.V1)).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(It.IsAny<SeasonData>(), ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        var result = await _adminModule.CalculateExperimentalSeasonPredictionsAsync(2024, [6, 5], RatingAlgorithmVersion.V1);

        Assert.Equal([5, 6], result.Weeks.Select(w => w.Week));
    }

    [Fact]
    public async Task CalculateExperimentalSeasonPredictionsAsync_UsesExplicitlyRequestedAlgorithmVersion()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockDataService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync(new List<Game>());
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(RatingAlgorithmVersion.V2)).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculateExperimentalSeasonPredictionsAsync(2024, [5], RatingAlgorithmVersion.V2);

        _mockPredictionAlgorithmResolver.Verify(x => x.Resolve(RatingAlgorithmVersion.V2), Times.Once);
    }

    [Fact]
    public async Task CalculateExperimentalSeasonTrendsAsync_CallsSeasonTrendsModuleBuildFromRankings_ReturnsResult()
    {
        var calendar = new[] { new CalendarWeek { Week = 1, SeasonType = "regular" } };
        var seasonData = new SeasonData { Season = 2024, Week = 1, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 1, Rankings = [] };
        var trendsResult = new SeasonTrendsResult { Season = 2024 };

        _mockDataService.Setup(x => x.GetCalendarAsync(2024)).ReturnsAsync(calendar);
        _mockSeasonModule.Setup(x => x.GetWeekLabels(calendar))
            .Returns(new[] { new WeekInfo { WeekNumber = 1, Label = "Week 2" } });
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 1)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);
        _mockSeasonTrendsModule
            .Setup(x => x.BuildFromRankingsAsync(2024, It.Is<IEnumerable<RankingsResult>>(r => r.Single() == rankings)))
            .ReturnsAsync(trendsResult);

        var result = await _adminModule.CalculateExperimentalSeasonTrendsAsync(2024, RatingAlgorithmVersion.V1);

        Assert.Same(trendsResult, result);
    }

    [Fact]
    public async Task CalculateExperimentalSeasonTrendsAsync_OrdersWeeklyRankingsByWeekNumber_PassesOrderedListToSeasonTrendsModule()
    {
        var calendar = new[]
        {
            new CalendarWeek { Week = 1, SeasonType = "regular" },
            new CalendarWeek { Week = 2, SeasonType = "regular" },
        };
        var seasonData1 = new SeasonData { Season = 2024, Week = 1, Teams = new Dictionary<string, TeamInfo>() };
        var seasonData2 = new SeasonData { Season = 2024, Week = 2, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankingsWeek1 = new RankingsResult { Season = 2024, Week = 1, Rankings = [] };
        var rankingsWeek2 = new RankingsResult { Season = 2024, Week = 2, Rankings = [] };

        _mockDataService.Setup(x => x.GetCalendarAsync(2024)).ReturnsAsync(calendar);
        _mockSeasonModule.Setup(x => x.GetWeekLabels(calendar))
            .Returns(new[]
            {
                new WeekInfo { WeekNumber = 2, Label = "Week 3" },
                new WeekInfo { WeekNumber = 1, Label = "Week 2" },
            });
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 1)).ReturnsAsync(seasonData1);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 2)).ReturnsAsync(seasonData2);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData1)).ReturnsAsync(ratings);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData2)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData1, ratings)).ReturnsAsync(rankingsWeek1);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData2, ratings)).ReturnsAsync(rankingsWeek2);

        IEnumerable<RankingsResult>? capturedRankings = null;
        _mockSeasonTrendsModule
            .Setup(x => x.BuildFromRankingsAsync(2024, It.IsAny<IEnumerable<RankingsResult>>()))
            .Callback<int, IEnumerable<RankingsResult>>((_, r) => capturedRankings = r)
            .ReturnsAsync(new SeasonTrendsResult { Season = 2024 });

        await _adminModule.CalculateExperimentalSeasonTrendsAsync(2024, RatingAlgorithmVersion.V1);

        Assert.NotNull(capturedRankings);
        var orderedWeeks = capturedRankings!.Select(r => r.Week).ToList();
        Assert.Equal(new[] { 1, 2 }, orderedWeeks);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_CallsServicesInOrder()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Texas"] = new(),
            ["Oklahoma"] = new(),
            ["Ohio State"] = new(),
            ["Michigan"] = new(),
            ["Alabama"] = new(),
            ["Florida"] = new()
        };
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Texas"] = new() { Rating = 90 },
            ["Oklahoma"] = new() { Rating = 80 }
        };
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Texas", AwayTeam = "Oklahoma" },
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Ohio State", AwayTeam = "Michigan" },
            new() { Week = 5, SeasonType = "regular", HomeTeam = "Alabama", AwayTeam = "Florida" }
        };
        var predictions = new List<GamePrediction>
        {
            new() { HomeTeam = "Texas", AwayTeam = "Oklahoma", PredictedWinner = "Texas" }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.Is<IEnumerable<ScheduleGame>>(g => g.Count() == 2), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(predictions);

        var result = await _adminModule.CalculatePredictionsAsync(2024, 5);

        Assert.NotNull(result);
        Assert.True(result.IsPersisted);
        Assert.Equal(2024, result.Predictions.Season);
        Assert.Equal(5, result.Predictions.Week);
        Assert.Single(result.Predictions.Predictions);
        _mockPredictionsModule.Verify(x => x.SaveAsync(It.IsAny<PredictionsResult>()), Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_ClearsComponentCachesBeforeFetching()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        var callOrder = new List<string>();
        _mockCache.Setup(x => x.RemoveAsync(It.IsAny<string>()))
            .Callback<string>(key => callOrder.Add($"cache_remove:{key}"))
            .ReturnsAsync(true);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5))
            .Callback(() => callOrder.Add("get_season_data"))
            .ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculatePredictionsAsync(2024, 5);

        _mockCache.Verify(x => x.RemoveAsync("teams_2024"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("fullSchedule_2024"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("bettingLines_2024_6"), Times.Once);
        Assert.True(callOrder.IndexOf("get_season_data") > callOrder.IndexOf("cache_remove:teams_2024"));
    }

    [Fact]
    public async Task CalculatePredictionsAsync_ExcludesNonFBSGames()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Ohio State"] = new(),
            ["Michigan"] = new()
        };
        var seasonData = new SeasonData { Season = 2024, Week = 4, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 5, SeasonType = "regular", HomeTeam = "Ohio State", AwayTeam = "Michigan" },
            new() { Week = 5, SeasonType = "regular", HomeTeam = "Ohio State", AwayTeam = "Youngstown State" },
            new() { Week = 5, SeasonType = "regular", HomeTeam = "North Dakota State", AwayTeam = "Michigan" }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 4)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculatePredictionsAsync(2024, 4);

        _mockPredictionCalculatorModule.Verify(x =>
            x.GeneratePredictionsAsync(seasonData, ratings,
                It.Is<IEnumerable<ScheduleGame>>(g =>
                    g.Count() == 1 && g.First().HomeTeam == "Ohio State" && g.First().AwayTeam == "Michigan"),
                It.IsAny<IEnumerable<BettingLine>>()),
            Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_FiltersGamesToNextWeekAndFBSOnly()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Nebraska"] = new(),
            ["Iowa"] = new(),
            ["USC"] = new(),
            ["Notre Dame"] = new(),
            ["Alabama"] = new(),
            ["Florida"] = new()
        };
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Nebraska", AwayTeam = "Iowa" },
            new() { Week = 6, SeasonType = "regular", HomeTeam = "USC", AwayTeam = "Notre Dame" },
            new() { Week = 5, SeasonType = "regular", HomeTeam = "Alabama", AwayTeam = "Florida" },
            new() { Week = 7, SeasonType = "regular", HomeTeam = "Alabama", AwayTeam = "Florida" }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculatePredictionsAsync(2024, 5);

        _mockPredictionCalculatorModule.Verify(x =>
            x.GeneratePredictionsAsync(seasonData, ratings,
                It.Is<IEnumerable<ScheduleGame>>(g =>
                    g.Count() == 2),
                It.IsAny<IEnumerable<BettingLine>>()),
            Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_PersistFailure_SetsIsPersistedFalse()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());
        _mockPredictionsModule.Setup(x => x.SaveAsync(It.IsAny<PredictionsResult>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        var result = await _adminModule.CalculatePredictionsAsync(2024, 5);

        Assert.False(result.IsPersisted);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_PostseasonWeek_IncludesAllPostseasonGames()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Texas"] = new(),
            ["Oklahoma"] = new(),
            ["Ohio State"] = new(),
            ["Michigan"] = new()
        };
        var seasonData = new SeasonData { Season = 2024, Week = 15, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 14, SeasonType = "regular", HomeTeam = "Texas", AwayTeam = "Oklahoma" },
            new() { Week = 1, SeasonType = "postseason", HomeTeam = "Ohio State", AwayTeam = "Michigan" },
            new() { Week = 1, SeasonType = "postseason", HomeTeam = "Texas", AwayTeam = "Oklahoma" }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 15)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculatePredictionsAsync(2024, 15);

        _mockPredictionCalculatorModule.Verify(x =>
            x.GeneratePredictionsAsync(seasonData, ratings,
                It.Is<IEnumerable<ScheduleGame>>(g =>
                    g.Count() == 2 && g.All(game => game.SeasonType == "postseason")),
                It.IsAny<IEnumerable<BettingLine>>()),
            Times.Once);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2024, 1), Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_RegularSeason_FetchesBettingLinesForNextWeek()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Nebraska"] = new(),
            ["Iowa"] = new()
        };
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Nebraska", AwayTeam = "Iowa" }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculatePredictionsAsync(2024, 5);

        _mockDataService.Verify(x => x.GetBettingLinesAsync(2024, 6), Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_UsesSelectedWeekForSeasonData()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 8, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 8)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculatePredictionsAsync(2024, 8);

        _mockDataService.Verify(x => x.GetSeasonDataAsync(2024, 8), Times.Once);
    }

    [Fact]
    public async Task CalculateRankingsAsync_CallsServicesInOrder()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        var result = await _adminModule.CalculateRankingsAsync(2024, 5);

        Assert.NotNull(result);
        Assert.Equal(2024, result.Rankings.Season);
        Assert.Equal(5, result.Rankings.Week);
        Assert.True(result.IsPersisted);
        _mockRankingsModule.Verify(x => x.SaveSnapshotAsync(rankings, RatingAlgorithmVersion.V1), Times.Once);
    }

    [Fact]
    public async Task CalculateRankingsAsync_ClearsComponentCachesBeforeFetching()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        var callOrder = new List<string>();
        _mockCache.Setup(x => x.RemoveAsync(It.IsAny<string>()))
            .Callback<string>(key => callOrder.Add($"cache_remove:{key}"))
            .ReturnsAsync(true);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5))
            .Callback(() => callOrder.Add("get_season_data"))
            .ReturnsAsync(seasonData);

        await _adminModule.CalculateRankingsAsync(2024, 5);

        _mockCache.Verify(x => x.RemoveAsync("advancedGameStats_2024_postseason"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("advancedGameStats_2024_regular"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("bettingLines_2024_1"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("bettingLines_2024_6"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("games_2024_postseason"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("games_2024_regular"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("seasonStats_2024"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("seasonStats_2024_week_5"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("teams_2024"), Times.Once);

        Assert.True(callOrder.IndexOf("get_season_data") > callOrder.IndexOf("cache_remove:teams_2024"));
    }

    [Fact]
    public async Task CalculateRankingsAsync_ClearsFullScheduleCache()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        await _adminModule.CalculateRankingsAsync(2024, 5);

        _mockCache.Verify(x => x.RemoveAsync("fullSchedule_2024"), Times.Once);
    }

    [Fact]
    public async Task CalculateRankingsAsync_GenerateRankingsAsyncThrows_PropagatesException()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule
            .Setup(x => x.GenerateRankingsAsync(seasonData, ratings))
            .ThrowsAsync(new InvalidOperationException("Rankings generation failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminModule.CalculateRankingsAsync(2024, 5));
    }

    [Fact]
    public async Task CalculateRankingsAsync_GetSeasonDataAsyncThrows_PropagatesException()
    {
        _mockDataService
            .Setup(x => x.GetSeasonDataAsync(2024, 5))
            .ThrowsAsync(new InvalidOperationException("API unavailable"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminModule.CalculateRankingsAsync(2024, 5));
    }

    [Fact]
    public async Task CalculateRankingsAsync_PersistFailure_DoesNotInvalidatePollLeadersCache()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);
        _mockRankingsModule.Setup(x => x.SaveSnapshotAsync(It.IsAny<RankingsResult>(), It.IsAny<RatingAlgorithmVersion>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        await _adminModule.CalculateRankingsAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task CalculateRankingsAsync_PersistFailure_SetsPersistedFalse()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);
        _mockRankingsModule.Setup(x => x.SaveSnapshotAsync(It.IsAny<RankingsResult>(), It.IsAny<RatingAlgorithmVersion>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        var result = await _adminModule.CalculateRankingsAsync(2024, 5);

        Assert.False(result.IsPersisted);
    }

    [Fact]
    public async Task CalculateRankingsAsync_RateTeamsAsyncThrows_PropagatesException()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule
            .Setup(x => x.RateTeamsAsync(seasonData))
            .ThrowsAsync(new InvalidOperationException("Rating calculation failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminModule.CalculateRankingsAsync(2024, 5));
    }

    [Fact]
    public async Task CalculateRankingsAsync_Success_InvalidatesPollLeadersCache()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        await _adminModule.CalculateRankingsAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task CalculateRankingsAsync_Success_InvalidatesSeasonTrendsCache()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        await _adminModule.CalculateRankingsAsync(2024, 5);

        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task CalculateRankingsAsync_UsesResolvedVersionForSnapshotTag()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);
        _mockRatingAlgorithmResolver.Setup(x => x.ResolveVersionForSeason(2024)).Returns(RatingAlgorithmVersion.V2);

        await _adminModule.CalculateRankingsAsync(2024, 5);

        _mockRankingsModule.Verify(x => x.SaveSnapshotAsync(rankings, RatingAlgorithmVersion.V2), Times.Once);
    }

    [Fact]
    public void Constructor_NullCache_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                null!,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullDataService_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                null!,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullExcelExportModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                null!,
                _mockCache.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _mockTrackRecordModule.Object,
                null!));
    }

    [Fact]
    public void Constructor_NullPollLeadersModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                null!,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullPredictionAlgorithmResolver_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockPollLeadersModule.Object,
                null!,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullPredictionGradingModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                null!,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullPredictionsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionGradingModule.Object,
                null!,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullRankingsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                null!,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullRatingAlgorithmResolver_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                null!,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullSeasonModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                null!,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullSeasonTrendsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                null!,
                _mockTeamPredictionRecordModule.Object,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullTeamPredictionRecordModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                null!,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullTrackRecordModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                null!,
                _mockLogger.Object));
    }

    [Fact]
    public async Task DeletePredictionsAsync_DelegatesToPredictionsModule()
    {
        _mockPredictionsModule.Setup(x => x.DeleteAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.DeletePredictionsAsync(2024, 5);

        Assert.True(result);
        _mockPredictionsModule.Verify(x => x.DeleteAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task DeletePredictionsAsync_Failure_DoesNotInvalidateTrackRecordCache()
    {
        _mockPredictionsModule.Setup(x => x.DeleteAsync(2024, 5)).ReturnsAsync(false);

        await _adminModule.DeletePredictionsAsync(2024, 5);

        _mockTrackRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
        _mockTeamPredictionRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task DeletePredictionsAsync_Success_InvalidatesTrackRecordCache()
    {
        _mockPredictionsModule.Setup(x => x.DeleteAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.DeletePredictionsAsync(2024, 5);

        _mockTrackRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
        _mockTeamPredictionRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteSnapshotAsync_DelegatesToRankingsModule()
    {
        _mockRankingsModule.Setup(x => x.DeleteSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.DeleteSnapshotAsync(2024, 5);

        Assert.True(result);
        _mockRankingsModule.Verify(x => x.DeleteSnapshotAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task DeleteSnapshotAsync_Failure_DoesNotInvalidatePollLeadersCache()
    {
        _mockRankingsModule.Setup(x => x.DeleteSnapshotAsync(2024, 5)).ReturnsAsync(false);

        await _adminModule.DeleteSnapshotAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task DeleteSnapshotAsync_RankingsModuleThrows_PropagatesException()
    {
        _mockRankingsModule
            .Setup(x => x.DeleteSnapshotAsync(2024, 5))
            .ThrowsAsync(new InvalidOperationException("Delete failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminModule.DeleteSnapshotAsync(2024, 5));
    }

    [Fact]
    public async Task DeleteSnapshotAsync_Success_InvalidatesPollLeadersCache()
    {
        _mockRankingsModule.Setup(x => x.DeleteSnapshotAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.DeleteSnapshotAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteSnapshotAsync_Success_InvalidatesSeasonTrendsCache()
    {
        _mockRankingsModule.Setup(x => x.DeleteSnapshotAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.DeleteSnapshotAsync(2024, 5);

        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task ExportExperimentalAsync_GeneratesWorkbookFromComputedRankings()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        var workbookBytes = new byte[] { 1, 2, 3 };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);
        _mockExcelExportModule.Setup(x => x.GenerateRankingsWorkbook(rankings)).Returns(workbookBytes);

        var result = await _adminModule.ExportExperimentalAsync(2024, 5, RatingAlgorithmVersion.V1);

        Assert.Same(workbookBytes, result);
    }

    [Fact]
    public async Task ExportExperimentalAsync_NeverPersistsSnapshot()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);
        _mockExcelExportModule.Setup(x => x.GenerateRankingsWorkbook(rankings)).Returns([1]);

        await _adminModule.ExportExperimentalAsync(2024, 5, RatingAlgorithmVersion.V1);

        _mockRankingsModule.Verify(
            x => x.SaveSnapshotAsync(It.IsAny<RankingsResult>(), It.IsAny<RatingAlgorithmVersion>()), Times.Never);
    }

    [Fact]
    public async Task ExportRankingsAsync_NoSnapshot_ReturnsNull()
    {
        _mockRankingsModule.Setup(x => x.GetSnapshotAsync(2024, 5)).ReturnsAsync((RankingsResult?)null);

        var result = await _adminModule.ExportRankingsAsync(2024, 5);

        Assert.Null(result);
        _mockExcelExportModule.Verify(x => x.GenerateRankingsWorkbook(It.IsAny<RankingsResult>()), Times.Never);
    }

    [Fact]
    public async Task ExportRankingsAsync_SnapshotExists_CallsGetSnapshotThenGenerateWorkbook()
    {
        var snapshot = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        var expectedBytes = new byte[] { 1, 2, 3 };
        var callOrder = new List<string>();

        _mockRankingsModule.Setup(x => x.GetSnapshotAsync(2024, 5))
            .Callback(() => callOrder.Add("get_snapshot"))
            .ReturnsAsync(snapshot);
        _mockExcelExportModule.Setup(x => x.GenerateRankingsWorkbook(snapshot))
            .Callback(() => callOrder.Add("generate_workbook"))
            .Returns(expectedBytes);

        await _adminModule.ExportRankingsAsync(2024, 5);

        Assert.Equal(2, callOrder.Count);
        Assert.True(callOrder.IndexOf("get_snapshot") < callOrder.IndexOf("generate_workbook"));
    }

    [Fact]
    public async Task ExportRankingsAsync_SnapshotExists_ReturnsBytes()
    {
        var snapshot = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        var expectedBytes = new byte[] { 1, 2, 3 };

        _mockRankingsModule.Setup(x => x.GetSnapshotAsync(2024, 5)).ReturnsAsync(snapshot);
        _mockExcelExportModule.Setup(x => x.GenerateRankingsWorkbook(snapshot)).Returns(expectedBytes);

        var result = await _adminModule.ExportRankingsAsync(2024, 5);

        Assert.Equal(expectedBytes, result);
    }

    [Fact]
    public async Task GetCFBDUsageAsync_DelegatesToDataService_WithForceRefreshFlag()
    {
        var usage = new CFBDUsage { RemainingCalls = 42 };

        _mockDataService.Setup(x => x.GetCFBDUsageAsync(true)).ReturnsAsync(usage);

        var result = await _adminModule.GetCFBDUsageAsync(forceRefresh: true);

        Assert.Equal(42, result.RemainingCalls);
        _mockDataService.Verify(x => x.GetCFBDUsageAsync(true), Times.Once);
    }

    [Fact]
    public async Task GetPredictionsAsync_CallsBothPredictionsModuleMethods()
    {
        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 5))
            .ReturnsAsync(new PredictionsResult { Season = 2024, Week = 5 });
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync())
            .ReturnsAsync(new List<PredictionsSummary>());

        await _adminModule.GetPredictionsAsync(2024, 5);

        _mockPredictionsModule.Verify(x => x.GetAsync(2024, 5), Times.Once);
        _mockPredictionsModule.Verify(x => x.GetAllSummariesAsync(), Times.Once);
    }

    [Fact]
    public async Task GetPredictionsAsync_DefaultsFlags_WhenNoMatchingSummaryFound()
    {
        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 5))
            .ReturnsAsync(new PredictionsResult { Season = 2024, Week = 5 });
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync())
            .ReturnsAsync(new List<PredictionsSummary>
            {
                new() { Season = 2024, Week = 1, IsGraded = true, IsPublished = true, ResultsPublished = true }
            });

        var result = await _adminModule.GetPredictionsAsync(2024, 5);

        Assert.NotNull(result);
        Assert.False(result.IsGraded);
        Assert.False(result.IsPublished);
        Assert.False(result.ResultsPublished);
    }

    [Fact]
    public async Task GetPredictionsAsync_ReturnsComposedResult_WhenMatchingSummaryExists()
    {
        var predictions = new PredictionsResult { Season = 2024, Week = 5 };
        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 5)).ReturnsAsync(predictions);
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync())
            .ReturnsAsync(new List<PredictionsSummary>
            {
                new() { Season = 2024, Week = 5, IsGraded = true, IsPublished = true, ResultsPublished = false }
            });

        var result = await _adminModule.GetPredictionsAsync(2024, 5);

        Assert.NotNull(result);
        Assert.Same(predictions, result.Predictions);
        Assert.True(result.IsGraded);
        Assert.True(result.IsPublished);
        Assert.False(result.ResultsPublished);
    }

    [Fact]
    public async Task GetPredictionsAsync_ReturnsNull_WhenNoPredictionsExist()
    {
        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 5)).ReturnsAsync((PredictionsResult?)null);
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync())
            .ReturnsAsync(new List<PredictionsSummary>());

        var result = await _adminModule.GetPredictionsAsync(2024, 5);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetPredictionsSummariesAsync_DelegatesToPredictionsModule()
    {
        var summaries = new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 1, IsPublished = true, GameCount = 10 }
        };
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(summaries);

        var result = await _adminModule.GetPredictionsSummariesAsync();

        Assert.Single(result);
        _mockPredictionsModule.Verify(x => x.GetAllSummariesAsync(), Times.Once);
    }

    [Fact]
    public async Task GetSnapshotsAsync_DelegatesToRankingsModule()
    {
        var weeks = new List<SnapshotSummary>
        {
            new SnapshotSummary { Season = 2024, Week = 1, IsPublished = true }
        };

        _mockRankingsModule.Setup(x => x.GetSnapshotsAsync()).ReturnsAsync(weeks);

        var result = await _adminModule.GetSnapshotsAsync();

        Assert.Single(result);
        _mockRankingsModule.Verify(x => x.GetSnapshotsAsync(), Times.Once);
    }

    [Fact]
    public async Task GradePredictionsAsync_DelegatesToGradingModule()
    {
        var gradeResult = new GradePredictionsResult
        {
            IsPersisted = true,
            Predictions = new PredictionsResult { Season = 2024, Week = 5 },
            UnmatchedGameCount = 0
        };
        _mockPredictionGradingModule.Setup(x => x.GradeAsync(2024, 5)).ReturnsAsync(gradeResult);

        var result = await _adminModule.GradePredictionsAsync(2024, 5);

        Assert.NotNull(result);
        Assert.True(result.IsPersisted);
        _mockPredictionGradingModule.Verify(x => x.GradeAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task GradePredictionsAsync_NoStoredPredictions_ReturnsNull()
    {
        _mockPredictionGradingModule.Setup(x => x.GradeAsync(2024, 5)).ReturnsAsync((GradePredictionsResult?)null);

        var result = await _adminModule.GradePredictionsAsync(2024, 5);

        Assert.Null(result);
    }

    [Fact]
    public async Task PublishGradedResultsAsync_DelegatesToPredictionsModule()
    {
        _mockPredictionsModule.Setup(x => x.PublishGradedResultsAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.PublishGradedResultsAsync(2024, 5);

        Assert.True(result);
        _mockPredictionsModule.Verify(x => x.PublishGradedResultsAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task PublishGradedResultsAsync_Failure_DoesNotInvalidateTrackRecordCache()
    {
        _mockPredictionsModule.Setup(x => x.PublishGradedResultsAsync(2024, 5)).ReturnsAsync(false);

        await _adminModule.PublishGradedResultsAsync(2024, 5);

        _mockTrackRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
        _mockTeamPredictionRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task PublishGradedResultsAsync_Success_InvalidatesTrackRecordCache()
    {
        _mockPredictionsModule.Setup(x => x.PublishGradedResultsAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.PublishGradedResultsAsync(2024, 5);

        _mockTrackRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
        _mockTeamPredictionRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task PublishPredictionsAsync_DelegatesToPredictionsModule()
    {
        _mockPredictionsModule.Setup(x => x.PublishAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.PublishPredictionsAsync(2024, 5);

        Assert.True(result);
        _mockPredictionsModule.Verify(x => x.PublishAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task PublishSnapshotAsync_DelegatesToRankingsModule()
    {
        _mockRankingsModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.PublishSnapshotAsync(2024, 5);

        Assert.True(result);
        _mockRankingsModule.Verify(x => x.PublishSnapshotAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task PublishSnapshotAsync_Failure_DoesNotInvalidatePollLeadersCache()
    {
        _mockRankingsModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(false);

        await _adminModule.PublishSnapshotAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task PublishSnapshotAsync_RankingsModuleThrows_PropagatesException()
    {
        _mockRankingsModule
            .Setup(x => x.PublishSnapshotAsync(2024, 5))
            .ThrowsAsync(new InvalidOperationException("Publish failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminModule.PublishSnapshotAsync(2024, 5));
    }

    [Fact]
    public async Task PublishSnapshotAsync_Success_InvalidatesPollLeadersCache()
    {
        _mockRankingsModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.PublishSnapshotAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task PublishSnapshotAsync_Success_InvalidatesSeasonTrendsCache()
    {
        _mockRankingsModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.PublishSnapshotAsync(2024, 5);

        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task RefreshSeasonCacheAsync_NoKeysCached_ReturnsZero()
    {
        _mockCache.Setup(x => x.RemoveAsync(It.IsAny<string>())).ReturnsAsync(false);

        var result = await _adminModule.RefreshSeasonCacheAsync(2024, 5);

        Assert.Equal(0, result);
    }

    [Fact]
    public async Task RefreshSeasonCacheAsync_RemovesAllSeasonScopedKeys()
    {
        _mockCache.Setup(x => x.RemoveAsync(It.IsAny<string>())).ReturnsAsync(true);

        await _adminModule.RefreshSeasonCacheAsync(2024, 5);

        _mockCache.Verify(x => x.RemoveAsync("teams_2024"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("fullSchedule_2024"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("games_2024_regular"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("games_2024_postseason"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("advancedGameStats_2024_regular"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("advancedGameStats_2024_postseason"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("seasonStats_2024"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("seasonStats_2024_week_5"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("bettingLines_2024_6"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("bettingLines_2024_1"), Times.Once);
    }

    [Fact]
    public async Task RefreshSeasonCacheAsync_ReturnsCountOfKeysActuallyRemoved()
    {
        _mockCache.Setup(x => x.RemoveAsync("teams_2024")).ReturnsAsync(true);
        _mockCache.Setup(x => x.RemoveAsync("fullSchedule_2024")).ReturnsAsync(true);
        _mockCache.Setup(x => x.RemoveAsync(It.Is<string>(k => k != "teams_2024" && k != "fullSchedule_2024")))
            .ReturnsAsync(false);

        var result = await _adminModule.RefreshSeasonCacheAsync(2024, 5);

        Assert.Equal(2, result);
    }
}
