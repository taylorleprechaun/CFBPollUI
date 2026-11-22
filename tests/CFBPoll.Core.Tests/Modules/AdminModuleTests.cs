using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using CFBPoll.Core.Tests.TestDoubles;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class AdminModuleTests
{
    private readonly AdminModule _adminModule;
    private readonly Mock<IPersistentCache> _mockCache;
    private readonly Mock<ICFBDataCacheRefresher> _mockCacheRefresher;
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<IExcelExportModule> _mockExcelExportModule;
    private readonly Mock<ILogger<AdminModule>> _mockLogger;
    private readonly Mock<IPollLeadersModule> _mockPollLeadersModule;
    private readonly Mock<IPredictionAlgorithmResolver> _mockPredictionAlgorithmResolver;
    private readonly Mock<IPredictionCalculatorModule> _mockPredictionCalculatorModule;
    private readonly Mock<IPredictionCalibrationModule> _mockPredictionCalibrationModule;
    private readonly Mock<IPredictionGradingModule> _mockPredictionGradingModule;
    private readonly Mock<IPredictionsModule> _mockPredictionsModule;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<IRatingAlgorithmResolver> _mockRatingAlgorithmResolver;
    private readonly Mock<IRatingModule> _mockRatingModule;
    private readonly Mock<ISeasonModule> _mockSeasonModule;
    private readonly Mock<ISeasonTrendsModule> _mockSeasonTrendsModule;
    private readonly Mock<ITeamPredictionRecordModule> _mockTeamPredictionRecordModule;
    private readonly Mock<ITrackRecordModule> _mockTrackRecordModule;
    private readonly FixedTimeProvider _timeProvider;

    public AdminModuleTests()
    {
        _mockCache = new Mock<IPersistentCache>();
        _mockCacheRefresher = new Mock<ICFBDataCacheRefresher>();
        _mockCacheRefresher.Setup(x => x.RefreshGameResultsAsync(It.IsAny<int>())).ReturnsAsync(new CacheRefreshResult());
        _mockCacheRefresher.Setup(x => x.RefreshSeasonScopedAsync(It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync(new CacheRefreshResult());
        _mockDataService = new Mock<ICFBDataService>();
        _mockExcelExportModule = new Mock<IExcelExportModule>();
        _mockLogger = new Mock<ILogger<AdminModule>>();
        _mockPollLeadersModule = new Mock<IPollLeadersModule>();
        _mockPredictionCalculatorModule = new Mock<IPredictionCalculatorModule>();
        _mockPredictionAlgorithmResolver = new Mock<IPredictionAlgorithmResolver>();
        _mockPredictionAlgorithmResolver.Setup(x => x.ResolveForSeason(It.IsAny<int>())).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(It.IsAny<RatingAlgorithmVersion>())).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionAlgorithmResolver.Setup(x => x.ResolveVersionForSeason(It.IsAny<int>())).Returns(RatingAlgorithmVersion.V1);
        _mockPredictionCalibrationModule = new Mock<IPredictionCalibrationModule>();
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
        _timeProvider = new FixedTimeProvider(new DateTimeOffset(2026, 12, 20, 12, 0, 0, TimeSpan.Zero));

        _mockDataService.Setup(x => x.GetBettingLinesAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(new List<BettingLine>());

        _adminModule = new AdminModule(
            _mockDataService.Object,
            _mockExcelExportModule.Object,
            _mockCache.Object,
            _mockCacheRefresher.Object,
            _mockPollLeadersModule.Object,
            _mockPredictionAlgorithmResolver.Object,
            _mockPredictionCalibrationModule.Object,
            _mockPredictionGradingModule.Object,
            _mockPredictionsModule.Object,
            _mockRankingsModule.Object,
            _mockRatingAlgorithmResolver.Object,
            _mockSeasonModule.Object,
            _mockSeasonTrendsModule.Object,
            _mockTeamPredictionRecordModule.Object,
            _timeProvider,
            _mockTrackRecordModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task AddNewPredictionGamesAsync_NoSelectedGameEligible_ReturnsNoneEligibleWithoutSaving()
    {
        SetUpNewGamesWeek([new() { AwayTeam = "Team C", HomeTeam = "Team D", SeasonType = "postseason", StartDate = new DateTime(2026, 12, 27, 20, 0, 0, DateTimeKind.Utc), Week = 1 }]);

        var result = await _adminModule.AddNewPredictionGamesAsync(2026, 15, [new PredictionGameSelection { AwayTeam = "Team E", HomeTeam = "Team F" }]);

        Assert.Equal(NewPredictionGamesOutcome.NoneEligible, result.Outcome);
        _mockPredictionsModule.Verify(x => x.UpdatePredictionsAsync(It.IsAny<PredictionsResult>()), Times.Never);
    }

    [Fact]
    public async Task AddNewPredictionGamesAsync_NullSelections_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _adminModule.AddNewPredictionGamesAsync(2026, 15, null!));
    }

    [Fact]
    public async Task AddNewPredictionGamesAsync_RegularSeasonWeek_ReturnsNotPostseason()
    {
        SetUpNewGamesWeek([]);
        _mockPredictionsModule.Setup(x => x.GetAsync(2026, 10)).ReturnsAsync(new PredictionsResult { Season = 2026, Week = 10 });

        var result = await _adminModule.AddNewPredictionGamesAsync(2026, 10, [new PredictionGameSelection { AwayTeam = "Team C", HomeTeam = "Team D" }]);

        Assert.Equal(NewPredictionGamesOutcome.NotPostseason, result.Outcome);
    }

    [Fact]
    public async Task AddNewPredictionGamesAsync_ResultsPublished_InvalidatesTrackRecordCache()
    {
        SetUpNewGamesWeek([new() { AwayTeam = "Team C", HomeTeam = "Team D", SeasonType = "postseason", StartDate = new DateTime(2026, 12, 27, 20, 0, 0, DateTimeKind.Utc), Week = 1 }]);
        _mockPredictionsModule.Setup(x => x.UpdatePredictionsAsync(It.IsAny<PredictionsResult>())).ReturnsAsync(true);
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>
        {
            new() { IsGraded = true, IsPublished = true, ResultsPublished = true, Season = 2026, Week = 15 }
        });

        await _adminModule.AddNewPredictionGamesAsync(2026, 15, [new PredictionGameSelection { AwayTeam = "Team C", HomeTeam = "Team D" }]);

        _mockTrackRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
        _mockTeamPredictionRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task AddNewPredictionGamesAsync_SelectedGames_AppendsAfterExistingPicksAndKeepsCalibration()
    {
        var kickoff = new DateTime(2026, 12, 27, 20, 0, 0, DateTimeKind.Utc);
        SetUpNewGamesWeek(
        [
            new() { AwayTeam = "Team C", HomeTeam = "Team D", SeasonType = "postseason", StartDate = kickoff, Week = 1 },
            new() { AwayTeam = "Team E", HomeTeam = "Team B", SeasonType = "postseason", StartDate = kickoff.AddHours(4), Week = 1 }
        ]);
        PredictionsResult? saved = null;
        _mockPredictionsModule.Setup(x => x.UpdatePredictionsAsync(It.IsAny<PredictionsResult>()))
            .Callback<PredictionsResult>(p => saved = p)
            .ReturnsAsync(true);

        var result = await _adminModule.AddNewPredictionGamesAsync(2026, 15, [new PredictionGameSelection { AwayTeam = "Team D", HomeTeam = "Team C" }]);

        Assert.Equal(NewPredictionGamesOutcome.Success, result.Outcome);
        Assert.Equal(1, result.AddedGameCount);
        Assert.NotNull(saved);
        Assert.Equal(["Team A", "Team D"], saved.Predictions.Select(p => p.HomeTeam));
        Assert.Equal(1.5, saved.AppliedCalibration!["paramA"]);
        _mockTrackRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task AnalyzePredictionCalibrationAsync_FetchesCachedLinesForUncoveredWeeksAndPriorSeasons()
    {
        var calculator = SetUpCalibrationAnalysis(2026, 4);

        await _adminModule.AnalyzePredictionCalibrationAsync(2026, 4, null);

        _mockDataService.Verify(x => x.GetBettingLinesAsync(2026, 1), Times.Once);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2026, 3), Times.Never);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2026, 4), Times.Never);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2024, 1), Times.Once);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2025, 2), Times.Once);
        calculator.Verify(x => x.AnalyzeCalibrationAsync(It.IsAny<SeasonData>(), It.IsAny<IEnumerable<HistoricalGameLine>>(), It.IsAny<IReadOnlyDictionary<int, IReadOnlyDictionary<string, double>>>(), null), Times.Once);
    }

    [Fact]
    public async Task AnalyzePredictionCalibrationAsync_InvalidCandidate_ReturnsInvalidValuesWithoutAnalyzing()
    {
        var calculator = SetUpCalibratedCalculator(2026);

        var result = await _adminModule.AnalyzePredictionCalibrationAsync(2026, 4, CalibrationValues(9, 0));

        Assert.Equal(AnalyzePredictionCalibrationOutcome.InvalidValues, result.Outcome);
        Assert.Contains("Param A", result.ErrorMessage);
        calculator.Verify(x => x.AnalyzeCalibrationAsync(It.IsAny<SeasonData>(), It.IsAny<IEnumerable<HistoricalGameLine>>(), It.IsAny<IReadOnlyDictionary<int, IReadOnlyDictionary<string, double>>>(), It.IsAny<IReadOnlyDictionary<string, double>?>()), Times.Never);
    }

    [Fact]
    public async Task AnalyzePredictionCalibrationAsync_ManyUncachedWeeks_LimitsConcurrentLineFetches()
    {
        SetUpCalibrationAnalysis(2026, 12);
        var inFlight = 0;
        var peakInFlight = 0;
        var fetchCount = 0;
        _mockDataService.Setup(x => x.GetBettingLinesAsync(It.IsAny<int>(), It.IsAny<int>()))
            .Returns(async () =>
            {
                var current = Interlocked.Increment(ref inFlight);
                InterlockedMax(ref peakInFlight, current);
                Interlocked.Increment(ref fetchCount);
                await Task.Delay(20);
                Interlocked.Decrement(ref inFlight);
                return new List<BettingLine>();
            });

        await _adminModule.AnalyzePredictionCalibrationAsync(2026, 12, null);

        Assert.Equal(14, fetchCount);
        Assert.InRange(peakInFlight, 1, 4);
    }

    [Fact]
    public async Task AnalyzePredictionCalibrationAsync_PassesSnapshotLinesAndEachWeeksAppliedValues()
    {
        var calculator = SetUpCalibrationAnalysis(2026, 4);
        _mockPredictionCalibrationModule.Setup(x => x.ResolveEffectiveAsync(2026, 1, It.IsAny<IEnumerable<PredictionCalibrationParameter>>()))
            .ReturnsAsync(new PredictionCalibration { Season = 2026, Values = CalibrationValues(0.5, 0.5), Week = 1 });
        List<HistoricalGameLine>? lines = null;
        IReadOnlyDictionary<int, IReadOnlyDictionary<string, double>>? appliedByWeek = null;
        calculator
            .Setup(x => x.AnalyzeCalibrationAsync(It.IsAny<SeasonData>(), It.IsAny<IEnumerable<HistoricalGameLine>>(), It.IsAny<IReadOnlyDictionary<int, IReadOnlyDictionary<string, double>>>(), It.IsAny<IReadOnlyDictionary<string, double>?>()))
            .Callback<SeasonData, IEnumerable<HistoricalGameLine>, IReadOnlyDictionary<int, IReadOnlyDictionary<string, double>>, IReadOnlyDictionary<string, double>?>((_, l, a, _) => { lines = l.ToList(); appliedByWeek = a; })
            .ReturnsAsync(new PredictionCalibrationAnalysis());

        await _adminModule.AnalyzePredictionCalibrationAsync(2026, 4, null);

        var snapshotLine = Assert.Single(lines!, l => l.HomeTeam == "Team A");
        Assert.Equal(4, snapshotLine.GameWeek);
        Assert.Equal(-3.5, snapshotLine.Spread);
        Assert.Equal(0.5, appliedByWeek![1]["paramA"]);
        Assert.Equal(0, appliedByWeek[2]["paramA"]);
        Assert.Equal(2, appliedByWeek[3]["paramA"]);
    }

    [Fact]
    public async Task AnalyzePredictionCalibrationAsync_PostseasonTargetWeek_FetchesEveryUncoveredRegularWeek()
    {
        SetUpCalibrationAnalysis(2026, 12);

        await _adminModule.AnalyzePredictionCalibrationAsync(2026, 12, null);

        _mockDataService.Verify(x => x.GetBettingLinesAsync(2026, 12), Times.Once);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2026, 3), Times.Never);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2026, 13), Times.Never);
    }

    [Fact]
    public async Task AnalyzePredictionCalibrationAsync_Success_ReturnsCalculatorAnalysis()
    {
        var calculator = SetUpCalibrationAnalysis(2026, 4);
        var analysis = new PredictionCalibrationAnalysis { SuggestedValues = CalibrationValues(1.2, -0.8) };
        calculator
            .Setup(x => x.AnalyzeCalibrationAsync(It.IsAny<SeasonData>(), It.IsAny<IEnumerable<HistoricalGameLine>>(), It.IsAny<IReadOnlyDictionary<int, IReadOnlyDictionary<string, double>>>(), It.IsAny<IReadOnlyDictionary<string, double>?>()))
            .ReturnsAsync(analysis);

        var result = await _adminModule.AnalyzePredictionCalibrationAsync(2026, 4, CalibrationValues(1, 1));

        Assert.Equal(AnalyzePredictionCalibrationOutcome.Success, result.Outcome);
        Assert.Same(analysis, result.Analysis);
    }

    [Fact]
    public async Task AnalyzePredictionCalibrationAsync_UncalibratedCalculator_ReturnsNotSupported()
    {
        var result = await _adminModule.AnalyzePredictionCalibrationAsync(2024, 4, null);

        Assert.Equal(AnalyzePredictionCalibrationOutcome.NotSupported, result.Outcome);
        Assert.Null(result.Analysis);
    }

    [Fact]
    public async Task AnalyzePredictionCalibrationAsync_WeekOne_PassesNoAppliedWeeksAndOnlyGameWeekOneLines()
    {
        var calculator = SetUpCalibrationAnalysis(2026, 1);
        IReadOnlyDictionary<int, IReadOnlyDictionary<string, double>>? appliedByWeek = null;
        calculator
            .Setup(x => x.AnalyzeCalibrationAsync(It.IsAny<SeasonData>(), It.IsAny<IEnumerable<HistoricalGameLine>>(), It.IsAny<IReadOnlyDictionary<int, IReadOnlyDictionary<string, double>>>(), It.IsAny<IReadOnlyDictionary<string, double>?>()))
            .Callback<SeasonData, IEnumerable<HistoricalGameLine>, IReadOnlyDictionary<int, IReadOnlyDictionary<string, double>>, IReadOnlyDictionary<string, double>?>((_, _, a, _) => appliedByWeek = a)
            .ReturnsAsync(new PredictionCalibrationAnalysis());

        await _adminModule.AnalyzePredictionCalibrationAsync(2026, 1, null);

        Assert.Empty(appliedByWeek!);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2026, 1), Times.Once);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2026, 2), Times.Never);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2025, 1), Times.Once);
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
    public async Task CalculateExperimentalAsync_NeverPersistsRankingsSnapshot()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        await _adminModule.CalculateExperimentalAsync(2024, 5, RatingAlgorithmVersion.V1);

        _mockRankingsModule.Verify(
            x => x.SaveRankingsSnapshotAsync(It.IsAny<RankingsResult>(), It.IsAny<RatingAlgorithmVersion>()), Times.Never);
    }

    [Fact]
    public async Task CalculateExperimentalMatchupAsync_BlankTeam_ThrowsArgumentException()
    {
        await Assert.ThrowsAnyAsync<ArgumentException>(
            () => _adminModule.CalculateExperimentalMatchupAsync(2024, 5, RatingAlgorithmVersion.V1, " ", "Florida", false));
    }

    [Fact]
    public async Task CalculateExperimentalMatchupAsync_CalculatorReturnsNoPrediction_ReturnsSuccessWithNullPrediction()
    {
        SetUpMatchupData(2024, 5, ["Team A", "Team B"], [], []);

        var result = await _adminModule.CalculateExperimentalMatchupAsync(2024, 5, RatingAlgorithmVersion.V1, "Team A", "Team B", false);

        Assert.Equal(ExperimentalMatchupOutcome.Success, result.Outcome);
        Assert.Null(result.Prediction);
    }

    [Fact]
    public async Task CalculateExperimentalMatchupAsync_CalibratedCalculator_ReturnsWeeksAppliedCalibration()
    {
        var seasonData = SetUpMatchupData(2026, 5, ["Team A", "Team B"], [], []);
        var calculator = SetUpExperimentalCalibratedCalculator(2026, RatingAlgorithmVersion.V2);
        SetUpEffectiveCalibration(2026, 5, CalibrationValues(1.5, -0.5));

        var result = await _adminModule.CalculateExperimentalMatchupAsync(2026, 5, RatingAlgorithmVersion.V2, "Team A", "Team B", false);

        Assert.Equal(-0.5, result.AppliedCalibration!["paramB"]);
        calculator.Verify(x => x.GeneratePredictionsAsync(seasonData, It.IsAny<IDictionary<string, RatingDetails>>(), It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>(), It.Is<IReadOnlyDictionary<string, double>>(c => c["paramA"] == 1.5)), Times.Once);
    }

    [Fact]
    public async Task CalculateExperimentalMatchupAsync_DifferentCasing_UsesCanonicalTeamNames()
    {
        var prediction = new GamePrediction { HomeTeam = "Notre Dame", AwayTeam = "Texas" };
        var seasonData = SetUpMatchupData(2024, 5, ["Notre Dame", "Texas"], [], [prediction]);
        List<ScheduleGame>? passedGames = null;
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, It.IsAny<IDictionary<string, RatingDetails>>(), It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .Callback<SeasonData, IDictionary<string, RatingDetails>, IEnumerable<ScheduleGame>, IEnumerable<BettingLine>>((_, _, games, _) => passedGames = games.ToList())
            .ReturnsAsync(new List<GamePrediction> { prediction });

        var result = await _adminModule.CalculateExperimentalMatchupAsync(2024, 5, RatingAlgorithmVersion.V1, "notre dame", "TEXAS", false);

        Assert.Equal(ExperimentalMatchupOutcome.Success, result.Outcome);
        Assert.Same(prediction, result.Prediction);
        var game = Assert.Single(passedGames!);
        Assert.Equal("Notre Dame", game.HomeTeam);
        Assert.Equal("Texas", game.AwayTeam);
    }

    [Fact]
    public async Task CalculateExperimentalMatchupAsync_ExactlyMatchesScheduledGame_PassesGameIDAndThatWeeksLines()
    {
        var schedule = new List<ScheduleGame>
        {
            new() { GameID = 611, Week = 6, SeasonType = "regular", HomeTeam = "Oklahoma", AwayTeam = "Florida", NeutralSite = false }
        };
        var seasonData = SetUpMatchupData(2024, 5, ["Florida", "Oklahoma"], schedule, []);
        var weekLines = new List<BettingLine> { new() { GameID = 611, SpreadOpen = -2.5, OverUnderOpen = 50.5 } };
        _mockDataService.Setup(x => x.GetBettingLinesAsync(2024, 6)).ReturnsAsync(weekLines);
        List<ScheduleGame>? passedGames = null;
        List<BettingLine>? passedLines = null;
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, It.IsAny<IDictionary<string, RatingDetails>>(), It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .Callback<SeasonData, IDictionary<string, RatingDetails>, IEnumerable<ScheduleGame>, IEnumerable<BettingLine>>((_, _, games, lines) =>
            {
                passedGames = games.ToList();
                passedLines = lines.ToList();
            })
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculateExperimentalMatchupAsync(2024, 5, RatingAlgorithmVersion.V1, "Oklahoma", "Florida", false);

        var game = Assert.Single(passedGames!);
        Assert.Equal(611, game.GameID);
        var line = Assert.Single(passedLines!);
        Assert.Equal(-2.5, line.SpreadOpen);
    }

    [Fact]
    public async Task CalculateExperimentalMatchupAsync_MultipleMeetings_ReturnsAllInOrderWithLaterGamesFlagged()
    {
        var schedule = new List<ScheduleGame>
        {
            new() { GameID = 950, Week = 1, SeasonType = "postseason", HomeTeam = "Iowa", AwayTeam = "USC", HomePoints = 20, AwayPoints = 23, NeutralSite = true },
            new() { GameID = 409, Week = 9, SeasonType = "regular", HomeTeam = "Iowa", AwayTeam = "USC", HomePoints = 14, AwayPoints = 10 },
            new() { GameID = 402, Week = 2, SeasonType = "regular", HomeTeam = "USC", AwayTeam = "Iowa", HomePoints = 21, AwayPoints = 27 },
            new() { GameID = 406, Week = 6, SeasonType = "regular", HomeTeam = "USC", AwayTeam = "Iowa", HomePoints = 30, AwayPoints = 3 },
            new() { GameID = 500, Week = 6, SeasonType = "regular", HomeTeam = "Iowa", AwayTeam = "Opponent", HomePoints = 40, AwayPoints = 0 },
            new() { GameID = 410, Week = 10, SeasonType = "regular", HomeTeam = "USC", AwayTeam = "Iowa" }
        };
        SetUpMatchupData(2024, 5, ["Iowa", "USC"], schedule, []);
        _mockDataService.Setup(x => x.GetBettingLinesAsync(2024, 2))
            .ReturnsAsync(new List<BettingLine> { new() { GameID = 402, SpreadOpen = -6.5, OverUnderOpen = 48 } });

        var result = await _adminModule.CalculateExperimentalMatchupAsync(2024, 5, RatingAlgorithmVersion.V1, "Iowa", "USC", false);

        Assert.Collection(result.ActualGames,
            game =>
            {
                Assert.Equal(2, game.Week);
                Assert.Equal("USC", game.HomeTeam);
                Assert.Equal(27, game.AwayPoints);
                Assert.Equal(-6.5, game.BettingSpread);
                Assert.Equal(48, game.BettingOverUnder);
                Assert.False(game.PlayedAfterPrediction);
            },
            game =>
            {
                Assert.Equal(6, game.Week);
                Assert.Null(game.BettingSpread);
                Assert.False(game.PlayedAfterPrediction);
            },
            game =>
            {
                Assert.Equal(9, game.Week);
                Assert.True(game.PlayedAfterPrediction);
            },
            game =>
            {
                Assert.Equal("postseason", game.SeasonType);
                Assert.True(game.NeutralSite);
                Assert.True(game.PlayedAfterPrediction);
            });
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2024, 1), Times.Once);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2024, 10), Times.Never);
    }

    [Fact]
    public async Task CalculateExperimentalMatchupAsync_NoMeetingsInSeason_ReturnsEmptyActualGamesWithoutFetchingLines()
    {
        var schedule = new List<ScheduleGame>
        {
            new() { GameID = 409, Week = 9, SeasonType = "regular", HomeTeam = "Nebraska", AwayTeam = "Opponent", HomePoints = 17, AwayPoints = 24 }
        };
        SetUpMatchupData(2024, 5, ["Nebraska", "Michigan"], schedule, []);

        var result = await _adminModule.CalculateExperimentalMatchupAsync(2024, 5, RatingAlgorithmVersion.V1, "Nebraska", "Michigan", false);

        Assert.Empty(result.ActualGames);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task CalculateExperimentalMatchupAsync_NoScheduledGame_PassesTeamsAndNeutralSiteWithoutLines()
    {
        var seasonData = SetUpMatchupData(2024, 5, ["Florida", "Iowa"], [], []);
        List<ScheduleGame>? passedGames = null;
        List<BettingLine>? passedLines = null;
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, It.IsAny<IDictionary<string, RatingDetails>>(), It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .Callback<SeasonData, IDictionary<string, RatingDetails>, IEnumerable<ScheduleGame>, IEnumerable<BettingLine>>((_, _, games, lines) =>
            {
                passedGames = games.ToList();
                passedLines = lines.ToList();
            })
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculateExperimentalMatchupAsync(2024, 5, RatingAlgorithmVersion.V2, "Iowa", "Florida", true);

        var game = Assert.Single(passedGames!);
        Assert.Equal("Iowa", game.HomeTeam);
        Assert.Equal("Florida", game.AwayTeam);
        Assert.True(game.NeutralSite);
        Assert.Null(game.GameID);
        Assert.Empty(passedLines!);
        _mockPredictionAlgorithmResolver.Verify(x => x.Resolve(RatingAlgorithmVersion.V2), Times.Once);
    }

    [Fact]
    public async Task CalculateExperimentalMatchupAsync_PostseasonWeek_PostseasonMeetingNotFlaggedAndUsesWeekOneLines()
    {
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 15, SeasonType = "regular", HomeTeam = "Team A", AwayTeam = "Team B" },
            new() { GameID = 900, Week = 1, SeasonType = "postseason", HomeTeam = "Ohio State", AwayTeam = "Oklahoma", HomePoints = 35, AwayPoints = 28 }
        };
        SetUpMatchupData(2024, 15, ["Ohio State", "Oklahoma"], schedule, []);
        _mockDataService.Setup(x => x.GetBettingLinesAsync(2024, 1))
            .ReturnsAsync(new List<BettingLine> { new() { GameID = 900, SpreadOpen = -3, OverUnderOpen = 55.5 } });

        var result = await _adminModule.CalculateExperimentalMatchupAsync(2024, 15, RatingAlgorithmVersion.V1, "Ohio State", "Oklahoma", true);

        var game = Assert.Single(result.ActualGames);
        Assert.Equal(35, game.HomePoints);
        Assert.Equal(-3, game.BettingSpread);
        Assert.Equal(55.5, game.BettingOverUnder);
        Assert.False(game.PlayedAfterPrediction);
    }

    [Fact]
    public async Task CalculateExperimentalMatchupAsync_SameTeamOnBothSides_ReturnsInvalidTeamWithoutCalculating()
    {
        SetUpMatchupData(2024, 5, ["Michigan", "Iowa"], [], []);

        var result = await _adminModule.CalculateExperimentalMatchupAsync(2024, 5, RatingAlgorithmVersion.V1, "Michigan", "michigan", false);

        Assert.Equal(ExperimentalMatchupOutcome.InvalidTeam, result.Outcome);
        _mockDataService.Verify(x => x.GetSeasonDataAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Theory]
    [InlineData("Florida", "Oklahoma", false, 6)]
    [InlineData("Oklahoma", "Florida", true, 6)]
    [InlineData("Oklahoma", "Florida", false, 7)]
    public async Task CalculateExperimentalMatchupAsync_ScheduledGameNotExactMatch_PassesNoGameIDOrLines(
        string homeTeam, string awayTeam, bool neutralSite, int scheduledWeek)
    {
        var schedule = new List<ScheduleGame>
        {
            new() { GameID = 611, Week = scheduledWeek, SeasonType = "regular", HomeTeam = "Oklahoma", AwayTeam = "Florida", NeutralSite = false }
        };
        var seasonData = SetUpMatchupData(2024, 5, ["Florida", "Oklahoma"], schedule, []);
        List<ScheduleGame>? passedGames = null;
        List<BettingLine>? passedLines = null;
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, It.IsAny<IDictionary<string, RatingDetails>>(), It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .Callback<SeasonData, IDictionary<string, RatingDetails>, IEnumerable<ScheduleGame>, IEnumerable<BettingLine>>((_, _, games, lines) =>
            {
                passedGames = games.ToList();
                passedLines = lines.ToList();
            })
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculateExperimentalMatchupAsync(2024, 5, RatingAlgorithmVersion.V1, homeTeam, awayTeam, neutralSite);

        Assert.Null(Assert.Single(passedGames!).GameID);
        Assert.Empty(passedLines!);
    }

    [Fact]
    public async Task CalculateExperimentalMatchupAsync_TeamNotFBSInSeason_ReturnsInvalidTeamWithoutCalculating()
    {
        SetUpMatchupData(2024, 5, ["Florida"], [], []);

        var result = await _adminModule.CalculateExperimentalMatchupAsync(2024, 5, RatingAlgorithmVersion.V1, "Florida", "Opponent", false);

        Assert.Equal(ExperimentalMatchupOutcome.InvalidTeam, result.Outcome);
        Assert.Null(result.Prediction);
        _mockPredictionCalculatorModule.Verify(
            x => x.GeneratePredictionsAsync(It.IsAny<SeasonData>(), It.IsAny<IDictionary<string, RatingDetails>>(), It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()),
            Times.Never);
    }


    [Fact]
    public async Task CalculateExperimentalPredictionsAsync_CalibratedCalculator_AppliesWeeksCalibrationWithoutSaving()
    {
        SetUpEmptyExperimentalWeek(2026, 5);
        var calculator = SetUpExperimentalCalibratedCalculator(2026, RatingAlgorithmVersion.V2);
        SetUpEffectiveCalibration(2026, 5, CalibrationValues(1.5, -0.5));

        var result = await _adminModule.CalculateExperimentalPredictionsAsync(2026, 5, RatingAlgorithmVersion.V2);

        Assert.Equal(1.5, result.AppliedCalibration!["paramA"]);
        calculator.Verify(x => x.GeneratePredictionsAsync(It.IsAny<SeasonData>(), It.IsAny<IDictionary<string, RatingDetails>>(), It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>(), It.Is<IReadOnlyDictionary<string, double>>(c => c["paramB"] == -0.5)), Times.Once);
        _mockPredictionCalibrationModule.Verify(x => x.SaveAsync(It.IsAny<PredictionCalibration>()), Times.Never);
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
    public async Task CalculateExperimentalPredictionsAsync_UncalibratedCalculator_ReturnsNoAppliedCalibration()
    {
        SetUpEmptyExperimentalWeek(2024, 5);
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(RatingAlgorithmVersion.V1)).Returns(_mockPredictionCalculatorModule.Object);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(It.IsAny<SeasonData>(), It.IsAny<IDictionary<string, RatingDetails>>(), It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        var result = await _adminModule.CalculateExperimentalPredictionsAsync(2024, 5, RatingAlgorithmVersion.V1);

        Assert.Null(result.AppliedCalibration);
        _mockPredictionCalibrationModule.Verify(x => x.ResolveEffectiveAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<IEnumerable<PredictionCalibrationParameter>>()), Times.Never);
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
    public async Task CalculateExperimentalSeasonPredictionsAsync_CalibratedCalculator_ReturnsEachWeeksAppliedCalibration()
    {
        SetUpEmptyExperimentalWeek(2026, 5);
        SetUpEmptyExperimentalWeek(2026, 6);
        SetUpExperimentalCalibratedCalculator(2026, RatingAlgorithmVersion.V2);
        SetUpEffectiveCalibration(2026, 5, CalibrationValues(1, 0));
        SetUpEffectiveCalibration(2026, 6, CalibrationValues(2, 0));

        var result = await _adminModule.CalculateExperimentalSeasonPredictionsAsync(2026, [5, 6], RatingAlgorithmVersion.V2);

        Assert.Equal([1.0, 2.0], result.Weeks.Select(w => w.AppliedCalibration!["paramA"]));
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
        _mockSeasonModule.Setup(x => x.GetWeekLabels(calendar, It.IsAny<IEnumerable<ScheduleGame>>()))
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
        _mockSeasonModule.Setup(x => x.GetWeekLabels(calendar, It.IsAny<IEnumerable<ScheduleGame>>()))
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
    public async Task CalculatePredictionsAsync_CalibratedCalculatorNoStoredCalibration_SavesCarriedForwardAndAppliesIt()
    {
        var (calculator, seasonData, ratings) = SetUpCalibratedCalculation(2024, 5);
        var carriedForward = new PredictionCalibration
        {
            Season = 2024,
            Source = PredictionCalibrationSource.CarriedForward,
            Values = new Dictionary<string, double> { ["paramA"] = 1.5 },
            Week = 5
        };
        _mockPredictionCalibrationModule
            .Setup(x => x.GetAsync(2024, 5, It.IsAny<IEnumerable<PredictionCalibrationParameter>>()))
            .ReturnsAsync((PredictionCalibration?)null);
        _mockPredictionCalibrationModule
            .Setup(x => x.ResolveCarriedForwardAsync(2024, 5, It.IsAny<IEnumerable<PredictionCalibrationParameter>>()))
            .ReturnsAsync(carriedForward);

        var result = await _adminModule.CalculatePredictionsAsync(2024, 5);

        Assert.Equal(1.5, result.Predictions.AppliedCalibration!["paramA"]);
        _mockPredictionCalibrationModule.Verify(x => x.SaveIfMissingAsync(carriedForward), Times.Once);
        _mockPredictionCalibrationModule.Verify(x => x.SaveAsync(It.IsAny<PredictionCalibration>()), Times.Never);
        calculator.Verify(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(),
            It.IsAny<IEnumerable<BettingLine>>(), carriedForward.Values), Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_CalibratedCalculatorStoredCalibration_AppliesStoredWithoutSaving()
    {
        var (calculator, seasonData, ratings) = SetUpCalibratedCalculation(2024, 5);
        var stored = new PredictionCalibration
        {
            Season = 2024,
            Source = PredictionCalibrationSource.Accepted,
            Values = new Dictionary<string, double> { ["paramA"] = -2 },
            Week = 5
        };
        _mockPredictionCalibrationModule
            .Setup(x => x.GetAsync(2024, 5, It.IsAny<IEnumerable<PredictionCalibrationParameter>>()))
            .ReturnsAsync(stored);

        var result = await _adminModule.CalculatePredictionsAsync(2024, 5);

        Assert.Equal(-2, result.Predictions.AppliedCalibration!["paramA"]);
        _mockPredictionCalibrationModule.Verify(x => x.SaveAsync(It.IsAny<PredictionCalibration>()), Times.Never);
        calculator.Verify(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(),
            It.IsAny<IEnumerable<BettingLine>>(), stored.Values), Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_CalibrationSaveFails_StillGeneratesPredictionsWithCarriedForwardValues()
    {
        SetUpCalibratedCalculation(2024, 5);
        _mockPredictionCalibrationModule
            .Setup(x => x.GetAsync(2024, 5, It.IsAny<IEnumerable<PredictionCalibrationParameter>>()))
            .ReturnsAsync((PredictionCalibration?)null);
        _mockPredictionCalibrationModule
            .Setup(x => x.ResolveCarriedForwardAsync(2024, 5, It.IsAny<IEnumerable<PredictionCalibrationParameter>>()))
            .ReturnsAsync(new PredictionCalibration
            {
                Season = 2024,
                Source = PredictionCalibrationSource.CarriedForward,
                Values = new Dictionary<string, double> { ["paramA"] = 0.5 },
                Week = 5
            });
        _mockPredictionCalibrationModule
            .Setup(x => x.SaveIfMissingAsync(It.IsAny<PredictionCalibration>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        var result = await _adminModule.CalculatePredictionsAsync(2024, 5);

        Assert.Equal(0.5, result.Predictions.AppliedCalibration!["paramA"]);
        Assert.True(result.IsPersisted);
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
    public async Task CalculatePredictionsAsync_DataRefreshedInPlaceBeforeFetching()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        var callOrder = new List<string>();
        _mockCacheRefresher.Setup(x => x.RefreshSeasonScopedAsync(2024, 5))
            .Callback(() => callOrder.Add("cache_refresh"))
            .ReturnsAsync(new CacheRefreshResult());
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5))
            .Callback(() => callOrder.Add("get_season_data"))
            .ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculatePredictionsAsync(2024, 5);

        Assert.Equal(["cache_refresh", "get_season_data"], callOrder);
        _mockCache.Verify(x => x.RemoveAsync(It.IsAny<string>()), Times.Never);
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
    public async Task CalculatePredictionsAsync_UncalibratedCalculator_LeavesAppliedCalibrationNull()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        var result = await _adminModule.CalculatePredictionsAsync(2024, 5);

        Assert.Null(result.Predictions.AppliedCalibration);
        _mockPredictionCalibrationModule.VerifyNoOtherCalls();
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
        _mockRankingsModule.Verify(x => x.SaveRankingsSnapshotAsync(rankings, RatingAlgorithmVersion.V1), Times.Once);
    }

    [Fact]
    public async Task CalculateRankingsAsync_DataRefreshedInPlaceBeforeFetching()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        var callOrder = new List<string>();
        _mockCacheRefresher.Setup(x => x.RefreshSeasonScopedAsync(2024, 5))
            .Callback(() => callOrder.Add("cache_refresh"))
            .ReturnsAsync(new CacheRefreshResult());
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5))
            .Callback(() => callOrder.Add("get_season_data"))
            .ReturnsAsync(seasonData);

        await _adminModule.CalculateRankingsAsync(2024, 5);

        Assert.Equal(["cache_refresh", "get_season_data"], callOrder);
        _mockCache.Verify(x => x.RemoveAsync(It.IsAny<string>()), Times.Never);
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
        _mockRankingsModule.Setup(x => x.SaveRankingsSnapshotAsync(It.IsAny<RankingsResult>(), It.IsAny<RatingAlgorithmVersion>()))
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
        _mockRankingsModule.Setup(x => x.SaveRankingsSnapshotAsync(It.IsAny<RankingsResult>(), It.IsAny<RatingAlgorithmVersion>()))
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
    public async Task CalculateRankingsAsync_UsesResolvedVersionForRankingsSnapshotTag()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);
        _mockRatingAlgorithmResolver.Setup(x => x.ResolveVersionForSeason(2024)).Returns(RatingAlgorithmVersion.V2);

        await _adminModule.CalculateRankingsAsync(2024, 5);

        _mockRankingsModule.Verify(x => x.SaveRankingsSnapshotAsync(rankings, RatingAlgorithmVersion.V2), Times.Once);
    }

    [Fact]
    public void Constructor_NullCache_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                null!,
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullCacheRefresher_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                null!,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
                _mockCacheRefresher.Object,
                null!,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                null!,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullPredictionCalibrationModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                null!,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                null!,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                null!,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                null!,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                null!,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                null!,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                null!,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                null!,
                _timeProvider,
                _mockTrackRecordModule.Object,
                _mockLogger.Object));
    }

    [Fact]
    public void Constructor_NullTimeProvider_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminModule(
                _mockDataService.Object,
                _mockExcelExportModule.Object,
                _mockCache.Object,
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
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
                _mockCacheRefresher.Object,
                _mockPollLeadersModule.Object,
                _mockPredictionAlgorithmResolver.Object,
                _mockPredictionCalibrationModule.Object,
                _mockPredictionGradingModule.Object,
                _mockPredictionsModule.Object,
                _mockRankingsModule.Object,
                _mockRatingAlgorithmResolver.Object,
                _mockSeasonModule.Object,
                _mockSeasonTrendsModule.Object,
                _mockTeamPredictionRecordModule.Object,
                _timeProvider,
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
    public async Task DeleteRankingsSnapshotAsync_DelegatesToRankingsModule()
    {
        _mockRankingsModule.Setup(x => x.DeleteRankingsSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.DeleteRankingsSnapshotAsync(2024, 5);

        Assert.True(result);
        _mockRankingsModule.Verify(x => x.DeleteRankingsSnapshotAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task DeleteRankingsSnapshotAsync_Failure_DoesNotInvalidatePollLeadersCache()
    {
        _mockRankingsModule.Setup(x => x.DeleteRankingsSnapshotAsync(2024, 5)).ReturnsAsync(false);

        await _adminModule.DeleteRankingsSnapshotAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task DeleteRankingsSnapshotAsync_RankingsModuleThrows_PropagatesException()
    {
        _mockRankingsModule
            .Setup(x => x.DeleteRankingsSnapshotAsync(2024, 5))
            .ThrowsAsync(new InvalidOperationException("Delete failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminModule.DeleteRankingsSnapshotAsync(2024, 5));
    }

    [Fact]
    public async Task DeleteRankingsSnapshotAsync_Success_InvalidatesPollLeadersCache()
    {
        _mockRankingsModule.Setup(x => x.DeleteRankingsSnapshotAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.DeleteRankingsSnapshotAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteRankingsSnapshotAsync_Success_InvalidatesSeasonTrendsCache()
    {
        _mockRankingsModule.Setup(x => x.DeleteRankingsSnapshotAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.DeleteRankingsSnapshotAsync(2024, 5);

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
    public async Task ExportExperimentalAsync_NeverPersistsRankingsSnapshot()
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
            x => x.SaveRankingsSnapshotAsync(It.IsAny<RankingsResult>(), It.IsAny<RatingAlgorithmVersion>()), Times.Never);
    }

    [Fact]
    public async Task ExportPredictionsAsync_NoPredictions_ReturnsNull()
    {
        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 5)).ReturnsAsync((PredictionsResult?)null);

        var result = await _adminModule.ExportPredictionsAsync(2024, 5);

        Assert.Null(result);
        _mockExcelExportModule.Verify(x => x.GeneratePredictionsWorkbook(It.IsAny<PredictionsResult>()), Times.Never);
    }

    [Fact]
    public async Task ExportPredictionsAsync_PredictionsExist_CallsGetThenGenerateWorkbook()
    {
        var predictions = new PredictionsResult { Season = 2024, Week = 5 };
        var expectedBytes = new byte[] { 1, 2, 3 };
        var callOrder = new List<string>();

        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 5))
            .Callback(() => callOrder.Add("get_predictions"))
            .ReturnsAsync(predictions);
        _mockExcelExportModule.Setup(x => x.GeneratePredictionsWorkbook(predictions))
            .Callback(() => callOrder.Add("generate_workbook"))
            .Returns(expectedBytes);

        await _adminModule.ExportPredictionsAsync(2024, 5);

        Assert.Equal(2, callOrder.Count);
        Assert.True(callOrder.IndexOf("get_predictions") < callOrder.IndexOf("generate_workbook"));
    }

    [Fact]
    public async Task ExportPredictionsAsync_PredictionsExist_ReturnsBytes()
    {
        var predictions = new PredictionsResult { Season = 2024, Week = 5 };
        var expectedBytes = new byte[] { 1, 2, 3 };

        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 5)).ReturnsAsync(predictions);
        _mockExcelExportModule.Setup(x => x.GeneratePredictionsWorkbook(predictions)).Returns(expectedBytes);

        var result = await _adminModule.ExportPredictionsAsync(2024, 5);

        Assert.Equal(expectedBytes, result);
    }

    [Fact]
    public async Task ExportRankingsAsync_NoRankingsSnapshot_ReturnsNull()
    {
        _mockRankingsModule.Setup(x => x.GetRankingsSnapshotAsync(2024, 5)).ReturnsAsync((RankingsResult?)null);

        var result = await _adminModule.ExportRankingsAsync(2024, 5);

        Assert.Null(result);
        _mockExcelExportModule.Verify(x => x.GenerateRankingsWorkbook(It.IsAny<RankingsResult>()), Times.Never);
    }

    [Fact]
    public async Task ExportRankingsAsync_RankingsSnapshotExists_CallsGetRankingsSnapshotThenGenerateWorkbook()
    {
        var rankingsSnapshot = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        var expectedBytes = new byte[] { 1, 2, 3 };
        var callOrder = new List<string>();

        _mockRankingsModule.Setup(x => x.GetRankingsSnapshotAsync(2024, 5))
            .Callback(() => callOrder.Add("get_rankings_snapshot"))
            .ReturnsAsync(rankingsSnapshot);
        _mockExcelExportModule.Setup(x => x.GenerateRankingsWorkbook(rankingsSnapshot))
            .Callback(() => callOrder.Add("generate_workbook"))
            .Returns(expectedBytes);

        await _adminModule.ExportRankingsAsync(2024, 5);

        Assert.Equal(2, callOrder.Count);
        Assert.True(callOrder.IndexOf("get_rankings_snapshot") < callOrder.IndexOf("generate_workbook"));
    }

    [Fact]
    public async Task ExportRankingsAsync_RankingsSnapshotExists_ReturnsBytes()
    {
        var rankingsSnapshot = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        var expectedBytes = new byte[] { 1, 2, 3 };

        _mockRankingsModule.Setup(x => x.GetRankingsSnapshotAsync(2024, 5)).ReturnsAsync(rankingsSnapshot);
        _mockExcelExportModule.Setup(x => x.GenerateRankingsWorkbook(rankingsSnapshot)).Returns(expectedBytes);

        var result = await _adminModule.ExportRankingsAsync(2024, 5);

        Assert.Equal(expectedBytes, result);
    }

    [Fact]
    public async Task GetCacheEntriesAsync_MapsEachEntryToASummary()
    {
        var metadata = new List<CacheEntryMetadata>
        {
            new() { CacheKey = "teams_2024", CachedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddHours(1), SizeBytes = 100 },
            new() { CacheKey = "conferences", CachedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddHours(1), SizeBytes = 50 }
        };
        _mockCache.Setup(x => x.GetAllEntriesMetadataAsync()).ReturnsAsync(metadata);

        var result = (await _adminModule.GetCacheEntriesAsync()).ToList();

        Assert.Equal(2, result.Count);
        Assert.Equal("Teams", result[0].Family);
        Assert.Equal(2024, result[0].Season);
        Assert.Equal("Conferences", result[1].Family);
        Assert.Null(result[1].Season);
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
    public async Task GetFBSTeamNamesAsync_ReturnsDistinctNonEmptyNamesSortedAlphabetically()
    {
        var teams = new List<FBSTeam>
        {
            new() { Name = "Texas" },
            new() { Name = "Alabama" },
            new() { Name = string.Empty },
            new() { Name = "texas" },
            new() { Name = "Michigan" }
        };
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2024)).ReturnsAsync(teams);

        var result = await _adminModule.GetFBSTeamNamesAsync(2024);

        Assert.Equal(["Alabama", "Michigan", "Texas"], result);
    }

    [Fact]
    public async Task GetIncompleteGamesAsync_DelegatesToSeasonModule_WithSeasonTypeFromCalendar()
    {
        var fullSchedule = new List<ScheduleGame>
        {
            new() { Week = 5, SeasonType = "regular", HomeTeam = "Oklahoma", AwayTeam = "Texas", Completed = false }
        };
        var incompleteGames = new List<ScheduleGame> { fullSchedule[0] };

        _mockDataService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(new[] { new CalendarWeek { Week = 5, SeasonType = "regular" } });
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(fullSchedule);
        _mockSeasonModule.Setup(x => x.GetIncompleteGames(5, "regular", fullSchedule)).Returns(incompleteGames);

        var result = await _adminModule.GetIncompleteGamesAsync(2024, 5);

        var incompleteGame = Assert.Single(result);
        Assert.Equal("Oklahoma", incompleteGame.HomeTeam);
        Assert.Equal("Texas", incompleteGame.AwayTeam);
    }

    [Fact]
    public async Task GetIncompleteGamesAsync_WithNoMatchingCalendarWeek_UsesEmptySeasonType()
    {
        var fullSchedule = new List<ScheduleGame>();

        _mockDataService.Setup(x => x.GetCalendarAsync(2024)).ReturnsAsync(new List<CalendarWeek>());
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(fullSchedule);
        _mockSeasonModule.Setup(x => x.GetIncompleteGames(5, string.Empty, fullSchedule)).Returns([]);

        var result = await _adminModule.GetIncompleteGamesAsync(2024, 5);

        Assert.Empty(result);
        _mockSeasonModule.Verify(x => x.GetIncompleteGames(5, string.Empty, fullSchedule), Times.Once);
    }

    [Fact]
    public async Task GetPredictionCalibrationAsync_DraftGeneratedBeforeCalibrationAndDefaultValues_DoesNotFlagMismatch()
    {
        SetUpCalibratedCalculator(2026);
        SetUpCalibrationState(2026, 4, values: CalibrationValues(0, 0), isStored: false, publishedWeeks: [],
            draft: new PredictionsResult { AppliedCalibration = null, Season = 2026, Week = 4 });

        var result = await _adminModule.GetPredictionCalibrationAsync(2026, 4);

        Assert.False(result.DraftUsesDifferentValues);
    }

    [Fact]
    public async Task GetPredictionCalibrationAsync_DraftGeneratedWithDifferentValues_FlagsMismatch()
    {
        SetUpCalibratedCalculator(2026);
        SetUpCalibrationState(2026, 4, values: CalibrationValues(1.5, 0), isStored: true, publishedWeeks: [],
            draft: new PredictionsResult { AppliedCalibration = CalibrationValues(0.5, 0), Season = 2026, Week = 4 });

        var result = await _adminModule.GetPredictionCalibrationAsync(2026, 4);

        Assert.True(result.DraftUsesDifferentValues);
    }

    [Fact]
    public async Task GetPredictionCalibrationAsync_NoStoredRow_ReturnsCarriedForwardValuesAsNotStored()
    {
        SetUpCalibratedCalculator(2026);
        SetUpCalibrationState(2026, 4, values: CalibrationValues(2, -1), isStored: false, publishedWeeks: [], draft: null);

        var result = await _adminModule.GetPredictionCalibrationAsync(2026, 4);

        Assert.True(result.IsSupported);
        Assert.False(result.IsStored);
        Assert.False(result.IsLocked);
        Assert.False(result.DraftUsesDifferentValues);
        Assert.Equal(PredictionCalibrationSource.CarriedForward, result.Calibration!.Source);
        Assert.Equal(2, result.Calibration.Values["paramA"]);
        Assert.Equal(2, result.Parameters.Count);
    }

    [Fact]
    public async Task GetPredictionCalibrationAsync_PublishedWeekGeneratedWithDifferentValues_IsLockedAndFlagsMismatch()
    {
        SetUpCalibratedCalculator(2026);
        SetUpCalibrationState(2026, 4, values: CalibrationValues(1.5, 0), isStored: true, publishedWeeks: [3, 4],
            draft: new PredictionsResult { AppliedCalibration = CalibrationValues(0, 0), Season = 2026, Week = 4 });

        var result = await _adminModule.GetPredictionCalibrationAsync(2026, 4);

        Assert.True(result.IsLocked);
        Assert.True(result.IsStored);
        Assert.True(result.DraftUsesDifferentValues);
    }

    [Fact]
    public async Task GetPredictionCalibrationAsync_UncalibratedCalculator_ReturnsNotSupported()
    {
        var result = await _adminModule.GetPredictionCalibrationAsync(2024, 4);

        Assert.False(result.IsSupported);
        Assert.Null(result.Calibration);
        _mockPredictionCalibrationModule.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetPredictionCalibrationHistoryAsync_MarksPublishedWeeksLocked()
    {
        _mockPredictionCalibrationModule.Setup(x => x.GetSeasonAsync(2026)).ReturnsAsync(
        [
            new PredictionCalibration { Season = 2026, Week = 2 },
            new PredictionCalibration { Season = 2026, Week = 3 }
        ]);
        _mockPredictionsModule.Setup(x => x.GetPublishedWeekNumbersAsync(2026)).ReturnsAsync([2]);

        var result = (await _adminModule.GetPredictionCalibrationHistoryAsync(2026)).ToList();

        Assert.Equal([2, 3], result.Select(e => e.Calibration.Week));
        Assert.True(result[0].IsLocked);
        Assert.False(result[1].IsLocked);
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
    public async Task GetPredictionsAsync_EmptySchedule_IsNotPostseason()
    {
        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 5)).ReturnsAsync(new PredictionsResult { Season = 2024, Week = 5 });
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>());
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());

        var result = await _adminModule.GetPredictionsAsync(2024, 5);

        Assert.False(result!.IsPostseason);
    }

    [Fact]
    public async Task GetPredictionsAsync_PostseasonWeek_SetsIsPostseason()
    {
        SetUpNewGamesWeek([]);
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>());

        var result = await _adminModule.GetPredictionsAsync(2026, 15);

        Assert.True(result!.IsPostseason);
    }

    [Fact]
    public async Task GetPredictionsAsync_RegularSeasonWeek_IsNotPostseason()
    {
        SetUpNewGamesWeek([]);
        _mockPredictionsModule.Setup(x => x.GetAsync(2026, 10)).ReturnsAsync(new PredictionsResult { Season = 2026, Week = 10 });
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(new List<PredictionsSummary>());

        var result = await _adminModule.GetPredictionsAsync(2026, 10);

        Assert.False(result!.IsPostseason);
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
    public async Task GetRankingsSnapshotAsync_CallsBothRankingsModuleMethods()
    {
        _mockRankingsModule.Setup(x => x.GetRankingsSnapshotAsync(2024, 5))
            .ReturnsAsync(new RankingsResult { Season = 2024, Week = 5, Rankings = [] });
        _mockRankingsModule.Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>());

        await _adminModule.GetRankingsSnapshotAsync(2024, 5);

        _mockRankingsModule.Verify(x => x.GetRankingsSnapshotAsync(2024, 5), Times.Once);
        _mockRankingsModule.Verify(x => x.GetRankingsSnapshotsAsync(), Times.Once);
    }

    [Fact]
    public async Task GetRankingsSnapshotAsync_DefaultsIsPublished_WhenNoMatchingSummaryFound()
    {
        _mockRankingsModule.Setup(x => x.GetRankingsSnapshotAsync(2024, 5))
            .ReturnsAsync(new RankingsResult { Season = 2024, Week = 5, Rankings = [] });
        _mockRankingsModule.Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>
            {
                new RankingsSnapshotSummary { Season = 2024, Week = 1, IsPublished = true }
            });

        var result = await _adminModule.GetRankingsSnapshotAsync(2024, 5);

        Assert.NotNull(result);
        Assert.False(result.IsPublished);
    }

    [Fact]
    public async Task GetRankingsSnapshotAsync_ReturnsComposedResult_WhenMatchingSummaryExists()
    {
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        _mockRankingsModule.Setup(x => x.GetRankingsSnapshotAsync(2024, 5)).ReturnsAsync(rankings);
        _mockRankingsModule.Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>
            {
                new RankingsSnapshotSummary { Season = 2024, Week = 5, IsPublished = true }
            });

        var result = await _adminModule.GetRankingsSnapshotAsync(2024, 5);

        Assert.NotNull(result);
        Assert.Same(rankings, result.Rankings);
        Assert.True(result.IsPublished);
    }

    [Fact]
    public async Task GetRankingsSnapshotAsync_ReturnsNull_WhenNoRankingsSnapshotExists()
    {
        _mockRankingsModule.Setup(x => x.GetRankingsSnapshotAsync(2024, 5)).ReturnsAsync((RankingsResult?)null);
        _mockRankingsModule.Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>());

        var result = await _adminModule.GetRankingsSnapshotAsync(2024, 5);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetRankingsSnapshotsAsync_DelegatesToRankingsModule()
    {
        var weeks = new List<RankingsSnapshotSummary>
        {
            new RankingsSnapshotSummary { Season = 2024, Week = 1, IsPublished = true }
        };

        _mockRankingsModule.Setup(x => x.GetRankingsSnapshotsAsync()).ReturnsAsync(weeks);

        var result = await _adminModule.GetRankingsSnapshotsAsync();

        Assert.Single(result);
        _mockRankingsModule.Verify(x => x.GetRankingsSnapshotsAsync(), Times.Once);
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
    public async Task GradePredictionsAsync_GameResultsRefreshedInPlaceBeforeGrading()
    {
        var callOrder = new List<string>();
        _mockCacheRefresher.Setup(x => x.RefreshGameResultsAsync(2024))
            .Callback(() => callOrder.Add("refreshCache"))
            .ReturnsAsync(new CacheRefreshResult { RefreshedCount = 3 });
        _mockPredictionGradingModule.Setup(x => x.GradeAsync(2024, 5))
            .Callback(() => callOrder.Add("grade"))
            .ReturnsAsync((GradePredictionsResult?)null);

        await _adminModule.GradePredictionsAsync(2024, 5);

        Assert.Equal(["refreshCache", "grade"], callOrder);
        _mockCache.Verify(x => x.RemoveManyAsync(It.IsAny<IEnumerable<string>>()), Times.Never);
    }

    [Fact]
    public async Task GradePredictionsAsync_NoStoredPredictions_ReturnsNull()
    {
        _mockPredictionGradingModule.Setup(x => x.GradeAsync(2024, 5)).ReturnsAsync((GradePredictionsResult?)null);

        var result = await _adminModule.GradePredictionsAsync(2024, 5);

        Assert.Null(result);
    }

    [Fact]
    public async Task GradePredictionsAsync_NotPersisted_DoesNotInvalidateTrackRecordCache()
    {
        _mockPredictionGradingModule.Setup(x => x.GradeAsync(2024, 5))
            .ReturnsAsync(new GradePredictionsResult { IsPersisted = false, Predictions = new PredictionsResult { Season = 2024, Week = 5 } });
        _mockPredictionsModule.Setup(x => x.AreResultsPublishedAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.GradePredictionsAsync(2024, 5);

        _mockTrackRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
        _mockTeamPredictionRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task GradePredictionsAsync_ResultsNotPublished_DoesNotInvalidateTrackRecordCache()
    {
        _mockPredictionGradingModule.Setup(x => x.GradeAsync(2024, 5))
            .ReturnsAsync(new GradePredictionsResult { IsPersisted = true, Predictions = new PredictionsResult { Season = 2024, Week = 5 } });
        _mockPredictionsModule.Setup(x => x.AreResultsPublishedAsync(2024, 5)).ReturnsAsync(false);

        await _adminModule.GradePredictionsAsync(2024, 5);

        _mockTrackRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
        _mockTeamPredictionRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task GradePredictionsAsync_ResultsPublished_InvalidatesTrackRecordCache()
    {
        _mockPredictionGradingModule.Setup(x => x.GradeAsync(2024, 5))
            .ReturnsAsync(new GradePredictionsResult { IsPersisted = true, Predictions = new PredictionsResult { Season = 2024, Week = 5 } });
        _mockPredictionsModule.Setup(x => x.AreResultsPublishedAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.GradePredictionsAsync(2024, 5);

        Assert.True(result!.ResultsPublished);
        _mockTrackRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
        _mockTeamPredictionRecordModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task PreviewNewPredictionGamesAsync_CompletedOrKickedOffGames_AreExcluded()
    {
        SetUpNewGamesWeek(
        [
            new() { AwayTeam = "Team C", HomeTeam = "Team D", SeasonType = "postseason", StartDate = new DateTime(2026, 12, 19, 20, 0, 0, DateTimeKind.Utc), Week = 1 },
            new() { AwayTeam = "Team E", HomeTeam = "Team B", Completed = true, SeasonType = "postseason", StartDate = new DateTime(2026, 12, 27, 20, 0, 0, DateTimeKind.Utc), Week = 1 }
        ]);

        var preview = await _adminModule.PreviewNewPredictionGamesAsync(2026, 15);

        Assert.Equal(NewPredictionGamesOutcome.Success, preview.Outcome);
        Assert.Empty(preview.Games);
        Assert.Empty(preview.WaitingOnLines);
    }

    [Fact]
    public async Task PreviewNewPredictionGamesAsync_GameAlreadyPredictedWithFlippedHomeAndAway_IsExcluded()
    {
        SetUpNewGamesWeek([new() { AwayTeam = "Team A", HomeTeam = "Team B", SeasonType = "postseason", StartDate = new DateTime(2026, 12, 27, 20, 0, 0, DateTimeKind.Utc), Week = 1 }]);

        var preview = await _adminModule.PreviewNewPredictionGamesAsync(2026, 15);

        Assert.Empty(preview.Games);
    }

    [Fact]
    public async Task PreviewNewPredictionGamesAsync_GameWithoutLine_IsListedAsWaitingOnLines()
    {
        SetUpNewGamesWeek([new() { AwayTeam = "Team E", HomeTeam = "Team F", SeasonType = "postseason", StartDate = new DateTime(2026, 12, 27, 20, 0, 0, DateTimeKind.Utc), Week = 1 }]);

        var preview = await _adminModule.PreviewNewPredictionGamesAsync(2026, 15);

        Assert.Empty(preview.Games);
        var waiting = Assert.Single(preview.WaitingOnLines);
        Assert.Equal("Team F", waiting.HomeTeam);
    }

    [Fact]
    public async Task PreviewNewPredictionGamesAsync_NewGames_PredictsWithStoredCalibrationAndCompletedPostseasonData()
    {
        var kickoff = new DateTime(2026, 12, 27, 20, 0, 0, DateTimeKind.Utc);
        var (calculator, _, seasonData) = SetUpNewGamesWeek(
        [
            new() { AwayTeam = "Team E", HomeTeam = "Team B", SeasonType = "postseason", StartDate = kickoff.AddHours(4), Week = 1 },
            new() { AwayTeam = "Team C", HomeTeam = "Team D", SeasonType = "postseason", StartDate = kickoff, Week = 1 }
        ]);

        var preview = await _adminModule.PreviewNewPredictionGamesAsync(2026, 15);

        Assert.Equal(["Team D", "Team B"], preview.Games.Select(g => g.HomeTeam));
        calculator.Verify(x => x.GeneratePredictionsAsync(
            seasonData, It.IsAny<IDictionary<string, RatingDetails>>(), It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>(),
            It.Is<IReadOnlyDictionary<string, double>>(c => c["paramA"] == 1.5)), Times.Once);
        _mockCacheRefresher.Verify(x => x.RefreshSeasonScopedAsync(2026, 15), Times.Once);
    }

    [Fact]
    public async Task PreviewNewPredictionGamesAsync_NoStoredPredictions_ReturnsNotFound()
    {
        _mockPredictionsModule.Setup(x => x.GetAsync(2026, 15)).ReturnsAsync((PredictionsResult?)null);

        var preview = await _adminModule.PreviewNewPredictionGamesAsync(2026, 15);

        Assert.Equal(NewPredictionGamesOutcome.NotFound, preview.Outcome);
    }

    [Fact]
    public async Task PreviewNewPredictionGamesAsync_RegularSeasonWeek_ReturnsNotPostseason()
    {
        SetUpNewGamesWeek([]);
        _mockPredictionsModule.Setup(x => x.GetAsync(2026, 10)).ReturnsAsync(new PredictionsResult { Season = 2026, Week = 10 });

        var preview = await _adminModule.PreviewNewPredictionGamesAsync(2026, 10);

        Assert.Equal(NewPredictionGamesOutcome.NotPostseason, preview.Outcome);
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
    public async Task PublishRankingsSnapshotAsync_DelegatesToRankingsModule()
    {
        SetUpCompleteWeek(2024, 5);
        _mockRankingsModule.Setup(x => x.PublishRankingsSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.PublishRankingsSnapshotAsync(2024, 5);

        Assert.Equal(PublishRankingsOutcome.Published, result);
        _mockRankingsModule.Verify(x => x.PublishRankingsSnapshotAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task PublishRankingsSnapshotAsync_Failure_DoesNotInvalidatePollLeadersCache()
    {
        SetUpCompleteWeek(2024, 5);
        _mockRankingsModule.Setup(x => x.PublishRankingsSnapshotAsync(2024, 5)).ReturnsAsync(false);

        var result = await _adminModule.PublishRankingsSnapshotAsync(2024, 5);

        Assert.Equal(PublishRankingsOutcome.NotFound, result);
        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task PublishRankingsSnapshotAsync_RankingsModuleThrows_PropagatesException()
    {
        SetUpCompleteWeek(2024, 5);
        _mockRankingsModule
            .Setup(x => x.PublishRankingsSnapshotAsync(2024, 5))
            .ThrowsAsync(new InvalidOperationException("Publish failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminModule.PublishRankingsSnapshotAsync(2024, 5));
    }

    [Fact]
    public async Task PublishRankingsSnapshotAsync_Success_InvalidatesPollLeadersCache()
    {
        SetUpCompleteWeek(2024, 5);
        _mockRankingsModule.Setup(x => x.PublishRankingsSnapshotAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.PublishRankingsSnapshotAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task PublishRankingsSnapshotAsync_Success_InvalidatesSeasonTrendsCache()
    {
        SetUpCompleteWeek(2024, 5);
        _mockRankingsModule.Setup(x => x.PublishRankingsSnapshotAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.PublishRankingsSnapshotAsync(2024, 5);

        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task PublishRankingsSnapshotAsync_WeekIncomplete_DoesNotCallRankingsModule()
    {
        SetUpIncompleteWeek(2024, 5);

        await _adminModule.PublishRankingsSnapshotAsync(2024, 5);

        _mockRankingsModule.Verify(x => x.PublishRankingsSnapshotAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task PublishRankingsSnapshotAsync_WeekIncomplete_ReturnsWeekIncomplete()
    {
        SetUpIncompleteWeek(2024, 5);

        var result = await _adminModule.PublishRankingsSnapshotAsync(2024, 5);

        Assert.Equal(PublishRankingsOutcome.WeekIncomplete, result);
    }

    [Fact]
    public async Task RefreshSeasonCacheAsync_NeverRemovesCacheEntries()
    {
        await _adminModule.RefreshSeasonCacheAsync(2024, 5);

        _mockCacheRefresher.Verify(x => x.RefreshSeasonScopedAsync(2024, 5), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync(It.IsAny<string>()), Times.Never);
        _mockCache.Verify(x => x.RemoveManyAsync(It.IsAny<IEnumerable<string>>()), Times.Never);
    }

    [Fact]
    public async Task RefreshSeasonCacheAsync_ReturnsRefresherCounts()
    {
        _mockCacheRefresher.Setup(x => x.RefreshSeasonScopedAsync(2024, 5))
            .ReturnsAsync(new CacheRefreshResult { FailedCount = 1, RefreshedCount = 7 });

        var result = await _adminModule.RefreshSeasonCacheAsync(2024, 5);

        Assert.Equal(1, result.FailedCount);
        Assert.Equal(7, result.RefreshedCount);
    }

    [Fact]
    public async Task RemoveCacheEntriesAsync_DelegatesToCache()
    {
        _mockCache.Setup(x => x.RemoveManyAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync(2);

        var result = await _adminModule.RemoveCacheEntriesAsync(["teams_2024", "conferences"]);

        Assert.Equal(2, result);
        _mockCache.Verify(x => x.RemoveManyAsync(It.IsAny<IEnumerable<string>>()), Times.Once);
    }

    [Fact]
    public async Task RemoveCacheEntryAsync_DelegatesToCache()
    {
        _mockCache.Setup(x => x.RemoveAsync("teams_2024")).ReturnsAsync(true);

        var result = await _adminModule.RemoveCacheEntryAsync("teams_2024");

        Assert.True(result);
        _mockCache.Verify(x => x.RemoveAsync("teams_2024"), Times.Once);
    }

    [Fact]
    public async Task SavePredictionCalibrationAsync_AcceptedSource_SavesAsAccepted()
    {
        SetUpCalibratedCalculator(2026);
        _mockPredictionsModule.Setup(x => x.GetPublishedWeekNumbersAsync(2026)).ReturnsAsync([]);
        PredictionCalibration? saved = null;
        _mockPredictionCalibrationModule.Setup(x => x.SaveAsync(It.IsAny<PredictionCalibration>()))
            .Callback<PredictionCalibration>(c => saved = c)
            .ReturnsAsync(true);

        var result = await _adminModule.SavePredictionCalibrationAsync(2026, 4, CalibrationValues(1.5, -1), PredictionCalibrationSource.Accepted);

        Assert.Equal(SavePredictionCalibrationOutcome.Saved, result.Outcome);
        Assert.Equal(PredictionCalibrationSource.Accepted, saved!.Source);
    }

    [Fact]
    public async Task SavePredictionCalibrationAsync_CarriedForwardSource_ThrowsArgumentException()
    {
        await Assert.ThrowsAsync<ArgumentException>(() => _adminModule.SavePredictionCalibrationAsync(2026, 4, CalibrationValues(0, 0), PredictionCalibrationSource.CarriedForward));
    }

    [Fact]
    public async Task SavePredictionCalibrationAsync_LaterCarriedForwardRows_PointsThemAtSavedWeekUntilAWeekSetItsOwnValues()
    {
        SetUpCalibratedCalculator(2026);
        _mockPredictionsModule.Setup(x => x.GetPublishedWeekNumbersAsync(2026)).ReturnsAsync([1, 2, 3]);
        _mockPredictionCalibrationModule.Setup(x => x.GetSeasonAsync(2026)).ReturnsAsync(
        [
            new PredictionCalibration { Season = 2026, Source = PredictionCalibrationSource.Manual, Values = CalibrationValues(1, 0), Week = 3 },
            new PredictionCalibration { CarriedFromSeason = 2026, CarriedFromWeek = 3, Season = 2026, Source = PredictionCalibrationSource.CarriedForward, Values = CalibrationValues(1, 0), Week = 5 },
            new PredictionCalibration { CarriedFromSeason = 2026, CarriedFromWeek = 3, Season = 2026, Source = PredictionCalibrationSource.CarriedForward, Values = CalibrationValues(1, 0), Week = 6 },
            new PredictionCalibration { Season = 2026, Source = PredictionCalibrationSource.Accepted, Values = CalibrationValues(3, 0), Week = 7 },
            new PredictionCalibration { CarriedFromSeason = 2026, CarriedFromWeek = 7, Season = 2026, Source = PredictionCalibrationSource.CarriedForward, Values = CalibrationValues(3, 0), Week = 8 }
        ]);
        var saved = new List<PredictionCalibration>();
        _mockPredictionCalibrationModule.Setup(x => x.SaveAsync(It.IsAny<PredictionCalibration>()))
            .Callback<PredictionCalibration>(saved.Add)
            .ReturnsAsync(true);

        await _adminModule.SavePredictionCalibrationAsync(2026, 4, CalibrationValues(2, 0), PredictionCalibrationSource.Manual);

        Assert.Equal([4, 5, 6], saved.Select(c => c.Week));
        Assert.All(saved.Skip(1), c =>
        {
            Assert.Equal(PredictionCalibrationSource.CarriedForward, c.Source);
            Assert.Equal(4, c.CarriedFromWeek);
            Assert.Equal(2, c.Values["paramA"]);
        });
    }

    [Fact]
    public async Task SavePredictionCalibrationAsync_MissingKey_ReturnsInvalidValuesWithoutSaving()
    {
        SetUpCalibratedCalculator(2026);
        _mockPredictionsModule.Setup(x => x.GetPublishedWeekNumbersAsync(2026)).ReturnsAsync([]);

        var result = await _adminModule.SavePredictionCalibrationAsync(2026, 4, new Dictionary<string, double> { ["paramA"] = 1 }, PredictionCalibrationSource.Manual);

        Assert.Equal(SavePredictionCalibrationOutcome.InvalidValues, result.Outcome);
        Assert.Contains("Param B", result.ErrorMessage);
        _mockPredictionCalibrationModule.Verify(x => x.SaveAsync(It.IsAny<PredictionCalibration>()), Times.Never);
    }

    [Fact]
    public async Task SavePredictionCalibrationAsync_NextCarriedWeekPublished_LeavesLaterRowsUnchanged()
    {
        SetUpCalibratedCalculator(2026);
        _mockPredictionsModule.Setup(x => x.GetPublishedWeekNumbersAsync(2026)).ReturnsAsync([5]);
        _mockPredictionCalibrationModule.Setup(x => x.GetSeasonAsync(2026)).ReturnsAsync(
        [
            new PredictionCalibration { Season = 2026, Source = PredictionCalibrationSource.CarriedForward, Values = CalibrationValues(1, 0), Week = 5 },
            new PredictionCalibration { Season = 2026, Source = PredictionCalibrationSource.CarriedForward, Values = CalibrationValues(1, 0), Week = 6 }
        ]);
        var saved = new List<PredictionCalibration>();
        _mockPredictionCalibrationModule.Setup(x => x.SaveAsync(It.IsAny<PredictionCalibration>()))
            .Callback<PredictionCalibration>(saved.Add)
            .ReturnsAsync(true);

        await _adminModule.SavePredictionCalibrationAsync(2026, 4, CalibrationValues(2, 0), PredictionCalibrationSource.Manual);

        Assert.Equal(4, Assert.Single(saved).Week);
    }

    [Theory]
    [InlineData(5.1)]
    [InlineData(-5.1)]
    [InlineData(double.NaN)]
    [InlineData(double.PositiveInfinity)]
    public async Task SavePredictionCalibrationAsync_OutOfRangeOrNonFiniteValue_ReturnsInvalidValuesWithoutSaving(double paramAValue)
    {
        SetUpCalibratedCalculator(2026);
        _mockPredictionsModule.Setup(x => x.GetPublishedWeekNumbersAsync(2026)).ReturnsAsync([]);

        var result = await _adminModule.SavePredictionCalibrationAsync(2026, 4, CalibrationValues(paramAValue, 0), PredictionCalibrationSource.Manual);

        Assert.Equal(SavePredictionCalibrationOutcome.InvalidValues, result.Outcome);
        Assert.Contains("Param A", result.ErrorMessage);
        _mockPredictionCalibrationModule.Verify(x => x.SaveAsync(It.IsAny<PredictionCalibration>()), Times.Never);
    }

    [Fact]
    public async Task SavePredictionCalibrationAsync_PublishedWeek_ReturnsLockedWithoutSaving()
    {
        SetUpCalibratedCalculator(2026);
        _mockPredictionsModule.Setup(x => x.GetPublishedWeekNumbersAsync(2026)).ReturnsAsync([4]);

        var result = await _adminModule.SavePredictionCalibrationAsync(2026, 4, CalibrationValues(1, 1), PredictionCalibrationSource.Manual);

        Assert.Equal(SavePredictionCalibrationOutcome.Locked, result.Outcome);
        _mockPredictionCalibrationModule.Verify(x => x.SaveAsync(It.IsAny<PredictionCalibration>()), Times.Never);
    }

    [Fact]
    public async Task SavePredictionCalibrationAsync_UncalibratedCalculator_ReturnsNotSupported()
    {
        var result = await _adminModule.SavePredictionCalibrationAsync(2024, 4, CalibrationValues(1, 1), PredictionCalibrationSource.Manual);

        Assert.Equal(SavePredictionCalibrationOutcome.NotSupported, result.Outcome);
        _mockPredictionCalibrationModule.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SavePredictionCalibrationAsync_UnknownKey_ReturnsInvalidValuesWithoutSaving()
    {
        SetUpCalibratedCalculator(2026);
        _mockPredictionsModule.Setup(x => x.GetPublishedWeekNumbersAsync(2026)).ReturnsAsync([]);
        var values = new Dictionary<string, double> { ["paramA"] = 1, ["paramB"] = 1, ["retiredParam"] = 3 };

        var result = await _adminModule.SavePredictionCalibrationAsync(2026, 4, values, PredictionCalibrationSource.Manual);

        Assert.Equal(SavePredictionCalibrationOutcome.InvalidValues, result.Outcome);
        Assert.Contains("retiredParam", result.ErrorMessage);
        _mockPredictionCalibrationModule.Verify(x => x.SaveAsync(It.IsAny<PredictionCalibration>()), Times.Never);
    }

    [Fact]
    public async Task SavePredictionCalibrationAsync_ValidValues_SavesAsManual()
    {
        SetUpCalibratedCalculator(2026);
        _mockPredictionsModule.Setup(x => x.GetPublishedWeekNumbersAsync(2026)).ReturnsAsync([1, 2, 3]);
        PredictionCalibration? saved = null;
        _mockPredictionCalibrationModule.Setup(x => x.SaveAsync(It.IsAny<PredictionCalibration>()))
            .Callback<PredictionCalibration>(c => saved = c)
            .ReturnsAsync(true);

        var result = await _adminModule.SavePredictionCalibrationAsync(2026, 4, CalibrationValues(-5, 10), PredictionCalibrationSource.Manual);

        Assert.Equal(SavePredictionCalibrationOutcome.Saved, result.Outcome);
        Assert.Equal(PredictionCalibrationSource.Manual, saved!.Source);
        Assert.Equal(2026, saved.Season);
        Assert.Equal(4, saved.Week);
        Assert.Equal(-5, saved.Values["paramA"]);
        Assert.Equal(10, saved.Values["paramB"]);
    }

    private Dictionary<string, double> CalibrationValues(double paramA, double paramB)
    {
        return new Dictionary<string, double> { ["paramA"] = paramA, ["paramB"] = paramB };
    }

    /// <summary>
    /// Raises <paramref name="target"/> to <paramref name="value"/> if it is higher, safely across threads.
    /// </summary>
    private void InterlockedMax(ref int target, int value)
    {
        int observed;
        while (value > (observed = Volatile.Read(ref target)) && Interlocked.CompareExchange(ref target, value, observed) != observed)
        {
        }
    }

    private (Mock<ICalibratedPredictionCalculator> Calculator, SeasonData SeasonData, Dictionary<string, RatingDetails> Ratings) SetUpCalibratedCalculation(int season, int week)
    {
        var seasonData = new SeasonData { Season = season, Week = week, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var calculator = SetUpCalibratedCalculator(season);
        calculator
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>(), It.IsAny<IReadOnlyDictionary<string, double>>()))
            .ReturnsAsync(new List<GamePrediction>());

        _mockDataService.Setup(x => x.GetSeasonDataAsync(season, week)).ReturnsAsync(seasonData);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(season)).ReturnsAsync(new List<ScheduleGame>());
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);

        return (calculator, seasonData, ratings);
    }

    /// <summary>
    /// Resolves the season to a calibrated calculator with two parameters: paramA in [-5, 5] and paramB in [-10, 10], both defaulting to 0.
    /// </summary>
    private Mock<ICalibratedPredictionCalculator> SetUpCalibratedCalculator(int season)
    {
        var calculator = new Mock<ICalibratedPredictionCalculator>();
        calculator.Setup(x => x.CalibrationParameters).Returns(
        [
            new PredictionCalibrationParameter { DefaultValue = 0, Key = "paramA", Label = "Param A", Max = 5, Min = -5, Step = 0.1 },
            new PredictionCalibrationParameter { DefaultValue = 0, Key = "paramB", Label = "Param B", Max = 10, Min = -10, Step = 0.1 }
        ]);

        _mockPredictionAlgorithmResolver.Setup(x => x.ResolveForSeason(season)).Returns(calculator.Object);

        return calculator;
    }

    /// <summary>
    /// Sets up an analysis of <paramref name="season"/> <paramref name="week"/> (expected to be 4): a 12-week regular season, snapshots for
    /// prediction weeks 2 (no applied values) and 3 (paramA 2, one lined game Team A vs Team B), and two-week calendars for the two prior seasons.
    /// </summary>
    private Mock<ICalibratedPredictionCalculator> SetUpCalibrationAnalysis(int season, int week)
    {
        var calculator = SetUpCalibratedCalculator(season);
        calculator
            .Setup(x => x.AnalyzeCalibrationAsync(It.IsAny<SeasonData>(), It.IsAny<IEnumerable<HistoricalGameLine>>(), It.IsAny<IReadOnlyDictionary<int, IReadOnlyDictionary<string, double>>>(), It.IsAny<IReadOnlyDictionary<string, double>?>()))
            .ReturnsAsync(new PredictionCalibrationAnalysis());

        _mockDataService.Setup(x => x.GetSeasonDataAsync(season, week)).ReturnsAsync(new SeasonData { Season = season, Week = week, Teams = new Dictionary<string, TeamInfo>() });
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(season))
            .ReturnsAsync(Enumerable.Range(1, 12).Select(w => new ScheduleGame { SeasonType = "regular", Week = w }).ToList());
        foreach (var priorSeason in new[] { season - 2, season - 1 })
        {
            _mockDataService.Setup(x => x.GetCalendarAsync(priorSeason)).ReturnsAsync(
            [
                new CalendarWeek { SeasonType = "regular", Week = 1 },
                new CalendarWeek { SeasonType = "regular", Week = 2 },
                new CalendarWeek { SeasonType = "postseason", Week = 1 }
            ]);
        }

        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(
        [
            new PredictionsSummary { Season = season, Week = 2 },
            new PredictionsSummary { Season = season, Week = 3 },
            new PredictionsSummary { Season = season, Week = 5 },
            new PredictionsSummary { Season = season - 1, Week = 3 }
        ]);
        _mockPredictionsModule.Setup(x => x.GetAsync(season, 2)).ReturnsAsync(new PredictionsResult { Season = season, Week = 2 });
        _mockPredictionsModule.Setup(x => x.GetAsync(season, 3)).ReturnsAsync(new PredictionsResult
        {
            AppliedCalibration = CalibrationValues(2, 0),
            Predictions = [new GamePrediction { AwayTeam = "Team B", BettingOverUnder = 50, BettingSpread = -3.5, HomeTeam = "Team A" }],
            Season = season,
            Week = 3
        });
        _mockPredictionCalibrationModule.Setup(x => x.ResolveEffectiveAsync(season, It.IsAny<int>(), It.IsAny<IEnumerable<PredictionCalibrationParameter>>()))
            .ReturnsAsync(new PredictionCalibration { Season = season, Values = CalibrationValues(0, 0) });

        return calculator;
    }

    /// <summary>
    /// Sets up a week's effective calibration (stored or carried forward), its draft predictions, and the season's published weeks.
    /// </summary>
    private void SetUpCalibrationState(int season, int week, IReadOnlyDictionary<string, double> values, bool isStored, IEnumerable<int> publishedWeeks, PredictionsResult? draft)
    {
        var calibration = new PredictionCalibration
        {
            Season = season,
            Source = isStored ? PredictionCalibrationSource.Manual : PredictionCalibrationSource.CarriedForward,
            Values = values,
            Week = week
        };

        _mockPredictionCalibrationModule.Setup(x => x.GetAsync(season, week, It.IsAny<IEnumerable<PredictionCalibrationParameter>>()))
            .ReturnsAsync(isStored ? calibration : null);
        _mockPredictionCalibrationModule.Setup(x => x.ResolveCarriedForwardAsync(season, week, It.IsAny<IEnumerable<PredictionCalibrationParameter>>()))
            .ReturnsAsync(calibration);
        _mockPredictionsModule.Setup(x => x.GetAsync(season, week)).ReturnsAsync(draft);
        _mockPredictionsModule.Setup(x => x.GetPublishedWeekNumbersAsync(season)).ReturnsAsync(publishedWeeks.ToList());
    }

    private void SetUpCompleteWeek(int season, int week)
    {
        _mockDataService.Setup(x => x.GetCalendarAsync(season))
            .ReturnsAsync(new[] { new CalendarWeek { Week = week, SeasonType = "regular" } });
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(season)).ReturnsAsync(new List<ScheduleGame>());
        _mockSeasonModule
            .Setup(x => x.IsWeekComplete(week, "regular", It.IsAny<IEnumerable<ScheduleGame>>()))
            .Returns(true);
    }

    private void SetUpEffectiveCalibration(int season, int week, Dictionary<string, double> values)
    {
        _mockPredictionCalibrationModule.Setup(x => x.ResolveEffectiveAsync(season, week, It.IsAny<IEnumerable<PredictionCalibrationParameter>>()))
            .ReturnsAsync(new PredictionCalibration { Season = season, Source = PredictionCalibrationSource.CarriedForward, Values = values, Week = week });
    }

    /// <summary>
    /// Sets up an experimental predictions week with no FBS teams, schedule or completed games.
    /// </summary>
    private void SetUpEmptyExperimentalWeek(int season, int week)
    {
        var seasonData = new SeasonData { Season = season, Week = week, Teams = new Dictionary<string, TeamInfo>() };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(season, week)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(new Dictionary<string, RatingDetails>());
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(season)).ReturnsAsync(new List<ScheduleGame>());
        _mockDataService.Setup(x => x.GetGamesAsync(season, "regular")).ReturnsAsync(new List<Game>());
    }

    /// <summary>
    /// A calibrated calculator returned for <paramref name="algorithmVersion"/> that generates no predictions.
    /// </summary>
    private Mock<ICalibratedPredictionCalculator> SetUpExperimentalCalibratedCalculator(int season, RatingAlgorithmVersion algorithmVersion)
    {
        var calculator = SetUpCalibratedCalculator(season);
        calculator
            .Setup(x => x.GeneratePredictionsAsync(It.IsAny<SeasonData>(), It.IsAny<IDictionary<string, RatingDetails>>(), It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>(), It.IsAny<IReadOnlyDictionary<string, double>>()))
            .ReturnsAsync(new List<GamePrediction>());
        _mockPredictionAlgorithmResolver.Setup(x => x.Resolve(algorithmVersion)).Returns(calculator.Object);

        return calculator;
    }

    private void SetUpIncompleteWeek(int season, int week)
    {
        _mockDataService.Setup(x => x.GetCalendarAsync(season))
            .ReturnsAsync(new[] { new CalendarWeek { Week = week, SeasonType = "regular" } });
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(season)).ReturnsAsync(new List<ScheduleGame>());
        _mockSeasonModule
            .Setup(x => x.IsWeekComplete(week, "regular", It.IsAny<IEnumerable<ScheduleGame>>()))
            .Returns(false);
    }

    private SeasonData SetUpMatchupData(
        int season, int week, IEnumerable<string> fbsTeamNames, IEnumerable<ScheduleGame> schedule, IEnumerable<GamePrediction> predictions)
    {
        var seasonData = new SeasonData { Season = season, Week = week, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetFBSTeamsAsync(season))
            .ReturnsAsync(fbsTeamNames.Select(n => new FBSTeam { Name = n }).ToList());
        _mockDataService.Setup(x => x.GetSeasonDataAsync(season, week)).ReturnsAsync(seasonData);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(season)).ReturnsAsync(schedule.ToList());
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(predictions.ToList());

        return seasonData;
    }

    /// <summary>
    /// Sets up 2026 prediction week 15 as a postseason week (the last regular week is 15) whose stored predictions hold Team B at
    /// Team A with paramA 1.5 applied, plus the given postseason games in the schedule. The calibrated calculator predicts every
    /// game it's given, with a 3.5-point line unless the home team is Team F.
    /// </summary>
    private (Mock<ICalibratedPredictionCalculator> Calculator, PredictionsResult Stored, SeasonData SeasonData) SetUpNewGamesWeek(IEnumerable<ScheduleGame> postseasonGames)
    {
        var stored = new PredictionsResult
        {
            AppliedCalibration = new Dictionary<string, double> { ["paramA"] = 1.5 },
            Predictions = [new GamePrediction { AwayTeam = "Team B", BettingSpread = -3, HomeTeam = "Team A", PredictedWinner = "Team A" }],
            Season = 2026,
            Week = 15
        };
        var teams = new[] { "Team A", "Team B", "Team C", "Team D", "Team E", "Team F" }.ToDictionary(t => t, _ => new TeamInfo());
        var seasonData = new SeasonData { Season = 2026, Teams = teams, Week = 16 };
        var ratings = new Dictionary<string, RatingDetails>();
        List<ScheduleGame> schedule =
        [
            new() { AwayTeam = "Team C", HomeTeam = "Team D", SeasonType = "regular", Week = 15 },
            .. postseasonGames
        ];

        _mockPredictionsModule.Setup(x => x.GetAsync(2026, 15)).ReturnsAsync(stored);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2026)).ReturnsAsync(schedule);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2026, 16)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);

        var calculator = SetUpCalibratedCalculator(2026);
        calculator
            .Setup(x => x.GeneratePredictionsAsync(It.IsAny<SeasonData>(), It.IsAny<IDictionary<string, RatingDetails>>(), It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>(), It.IsAny<IReadOnlyDictionary<string, double>>()))
            .ReturnsAsync((SeasonData _, IDictionary<string, RatingDetails> _, IEnumerable<ScheduleGame> games, IEnumerable<BettingLine> _, IReadOnlyDictionary<string, double> _) =>
                games.Select(g => new GamePrediction
                {
                    AwayTeam = g.AwayTeam!,
                    BettingSpread = g.HomeTeam == "Team F" ? null : -3.5,
                    HomeTeam = g.HomeTeam!,
                    PredictedWinner = g.HomeTeam!
                }).ToList());

        return (calculator, stored, seasonData);
    }
}
