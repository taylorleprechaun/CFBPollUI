using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class PredictionGradingModuleTests
{
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<ILogger<PredictionGradingModule>> _mockLogger;
    private readonly Mock<IPredictionsModule> _mockPredictionsModule;
    private readonly PredictionGradingModule _module;

    public PredictionGradingModuleTests()
    {
        _mockDataService = new Mock<ICFBDataService>();
        _mockLogger = new Mock<ILogger<PredictionGradingModule>>();
        _mockPredictionsModule = new Mock<IPredictionsModule>();

        _module = new PredictionGradingModule(_mockDataService.Object, _mockLogger.Object, _mockPredictionsModule.Object);

        _mockPredictionsModule.Setup(x => x.SaveGradedResultAsync(It.IsAny<PredictionsResult>())).ReturnsAsync(true);
    }

    [Fact]
    public void Constructor_ThrowsOnNullDataService()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new PredictionGradingModule(null!, _mockLogger.Object, _mockPredictionsModule.Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullLogger()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new PredictionGradingModule(_mockDataService.Object, null!, _mockPredictionsModule.Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullPredictionsModule()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new PredictionGradingModule(_mockDataService.Object, _mockLogger.Object, null!));
    }

    [Fact]
    public async Task GradeAsync_ActualScoreTied_SetsWinnerGradeNotApplicable()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(),
            BuildGame("Ohio State", "Michigan", homePoints: 21, awayPoints: 21));

        var result = await _module.GradeAsync(2024, 5);

        var graded = Assert.Single(result!.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.NotApplicable, graded.WinnerGrade);
        Assert.Null(graded.ActualWinner);
    }

    [Fact]
    public async Task GradeAsync_NoBettingOverUnder_SetsOverUnderGradeNotApplicable()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(bettingOverUnder: null, myOverUnderPick: string.Empty),
            BuildGame("Ohio State", "Michigan", homePoints: 28, awayPoints: 17));

        var result = await _module.GradeAsync(2024, 5);

        var graded = Assert.Single(result!.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.NotApplicable, graded.OverUnderGrade);
        Assert.Null(graded.ActualOverUnderResult);
    }

    [Fact]
    public async Task GradeAsync_NoBettingSpread_SetsSpreadGradeNotApplicable()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(bettingSpread: null, mySpreadPick: string.Empty),
            BuildGame("Ohio State", "Michigan", homePoints: 28, awayPoints: 17));

        var result = await _module.GradeAsync(2024, 5);

        var graded = Assert.Single(result!.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.NotApplicable, graded.SpreadGrade);
        Assert.Null(graded.ActualSpreadCoveringTeam);
    }

    [Fact]
    public async Task GradeAsync_NoStoredPredictions_ReturnsNull()
    {
        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 5)).ReturnsAsync((PredictionsResult?)null);

        var result = await _module.GradeAsync(2024, 5);

        Assert.Null(result);
    }

    [Fact]
    public async Task GradeAsync_OverUnderCorrect_SetsOverUnderGradeCorrect()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(myOverUnderPick: "Over", bettingOverUnder: 44),
            BuildGame("Ohio State", "Michigan", homePoints: 28, awayPoints: 17));

        var result = await _module.GradeAsync(2024, 5);

        var graded = Assert.Single(result!.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.Correct, graded.OverUnderGrade);
        Assert.Equal("Over", graded.ActualOverUnderResult);
    }

    [Fact]
    public async Task GradeAsync_OverUnderExactPush_SetsOverUnderGradePush()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(myOverUnderPick: "Over", bettingOverUnder: 45),
            BuildGame("Ohio State", "Michigan", homePoints: 28, awayPoints: 17));

        var result = await _module.GradeAsync(2024, 5);

        var graded = Assert.Single(result!.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.Push, graded.OverUnderGrade);
        Assert.Equal("Push", graded.ActualOverUnderResult);
    }

    [Fact]
    public async Task GradeAsync_OverUnderIncorrect_SetsOverUnderGradeIncorrect()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(myOverUnderPick: "Over", bettingOverUnder: 50),
            BuildGame("Ohio State", "Michigan", homePoints: 28, awayPoints: 17));

        var result = await _module.GradeAsync(2024, 5);

        var graded = Assert.Single(result!.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.Incorrect, graded.OverUnderGrade);
        Assert.Equal("Under", graded.ActualOverUnderResult);
    }

    [Fact]
    public async Task GradeAsync_PersistsViaSaveGradedResultAsync()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(),
            BuildGame("Ohio State", "Michigan", homePoints: 28, awayPoints: 17));

        var result = await _module.GradeAsync(2024, 5);

        Assert.True(result!.IsPersisted);
        _mockPredictionsModule.Verify(x => x.SaveGradedResultAsync(It.IsAny<PredictionsResult>()), Times.Once);
    }

    [Fact]
    public async Task GradeAsync_PostseasonWeek_FetchesPostseasonGames()
    {
        var stored = new PredictionsResult
        {
            Season = 2024,
            Week = 15,
            Predictions = [BuildPrediction()]
        };
        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 15)).ReturnsAsync(stored);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024))
            .ReturnsAsync([new ScheduleGame { Week = 14, SeasonType = "regular", HomeTeam = "Placeholder", AwayTeam = "Placeholder2" }]);
        _mockDataService.Setup(x => x.GetGamesAsync(2024, "postseason"))
            .ReturnsAsync([BuildGame("Ohio State", "Michigan", 28, 17, week: 1, seasonType: "postseason")]);

        var result = await _module.GradeAsync(2024, 15);

        Assert.NotNull(result);
        Assert.Equal(0, result.UnmatchedGameCount);
        _mockDataService.Verify(x => x.GetGamesAsync(2024, "postseason"), Times.Once);
        _mockDataService.Verify(x => x.GetGamesAsync(2024, "regular"), Times.Never);
    }

    [Fact]
    public async Task GradeAsync_PredictedWinnerMatchesActual_SetsWinnerGradeCorrect()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(predictedWinner: "Ohio State"),
            BuildGame("Ohio State", "Michigan", homePoints: 28, awayPoints: 17));

        var result = await _module.GradeAsync(2024, 5);

        var graded = Assert.Single(result!.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.Correct, graded.WinnerGrade);
        Assert.Equal("Ohio State", graded.ActualWinner);
        Assert.Equal(28, graded.ActualHomeScore);
        Assert.Equal(17, graded.ActualAwayScore);
    }

    [Fact]
    public async Task GradeAsync_PredictedWinnerWrong_SetsWinnerGradeIncorrect()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(predictedWinner: "Michigan"),
            BuildGame("Ohio State", "Michigan", homePoints: 28, awayPoints: 17));

        var result = await _module.GradeAsync(2024, 5);

        var graded = Assert.Single(result!.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.Incorrect, graded.WinnerGrade);
        Assert.Equal("Ohio State", graded.ActualWinner);
    }
    [Fact]
    public async Task GradeAsync_SaveFails_SetsIsPersistedFalse()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(),
            BuildGame("Ohio State", "Michigan", homePoints: 28, awayPoints: 17));
        _mockPredictionsModule.Setup(x => x.SaveGradedResultAsync(It.IsAny<PredictionsResult>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        var result = await _module.GradeAsync(2024, 5);

        Assert.NotNull(result);
        Assert.False(result.IsPersisted);
    }

    [Fact]
    public async Task GradeAsync_SpreadExactPush_SetsSpreadGradePush()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(mySpreadPick: "Ohio State", bettingSpread: -3),
            BuildGame("Ohio State", "Michigan", homePoints: 28, awayPoints: 25));

        var result = await _module.GradeAsync(2024, 5);

        var graded = Assert.Single(result!.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.Push, graded.SpreadGrade);
        Assert.Equal("Push", graded.ActualSpreadCoveringTeam);
    }

    [Fact]
    public async Task GradeAsync_SpreadPickCorrect_SetsSpreadGradeCorrect()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(mySpreadPick: "Ohio State", bettingSpread: -3.5),
            BuildGame("Ohio State", "Michigan", homePoints: 28, awayPoints: 17));

        var result = await _module.GradeAsync(2024, 5);

        var graded = Assert.Single(result!.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.Correct, graded.SpreadGrade);
        Assert.Equal("Ohio State", graded.ActualSpreadCoveringTeam);
    }

    [Fact]
    public async Task GradeAsync_SpreadPickIncorrect_SetsSpreadGradeIncorrect()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(mySpreadPick: "Ohio State", bettingSpread: -3.5),
            BuildGame("Ohio State", "Michigan", homePoints: 20, awayPoints: 19));

        var result = await _module.GradeAsync(2024, 5);

        var graded = Assert.Single(result!.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.Incorrect, graded.SpreadGrade);
        Assert.Equal("Michigan", graded.ActualSpreadCoveringTeam);
    }
    [Fact]
    public async Task GradeAsync_TeamNameCasingDiffers_StillMatches()
    {
        SetupRegularSeasonWeek(2024, 5, BuildPrediction(homeTeam: "Ohio State", awayTeam: "Michigan"),
            BuildGame("OHIO STATE", "michigan", homePoints: 28, awayPoints: 17));

        var result = await _module.GradeAsync(2024, 5);

        Assert.Equal(0, result!.UnmatchedGameCount);
        var graded = Assert.Single(result.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.Correct, graded.WinnerGrade);
    }

    [Fact]
    public async Task GradeAsync_UnmatchedGame_LeavesGradesUngradedAndIncrementsUnmatchedCount()
    {
        var stored = new PredictionsResult
        {
            Season = 2024,
            Week = 5,
            Predictions = [BuildPrediction(homeTeam: "Ohio State", awayTeam: "Michigan")]
        };
        _mockPredictionsModule.Setup(x => x.GetAsync(2024, 5)).ReturnsAsync(stored);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(BuildRegularSeasonSchedule());
        _mockDataService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync([]);

        var result = await _module.GradeAsync(2024, 5);

        Assert.NotNull(result);
        Assert.Equal(1, result.UnmatchedGameCount);
        var graded = Assert.Single(result.Predictions.Predictions);
        Assert.Equal(PredictionGradeStatus.Ungraded, graded.WinnerGrade);
        Assert.Null(graded.ActualWinner);
    }
    private static Game BuildGame(
        string homeTeam, string awayTeam, int homePoints, int awayPoints, int week = 6, string seasonType = "regular") =>
        new()
        {
            AwayPoints = awayPoints,
            AwayTeam = awayTeam,
            HomePoints = homePoints,
            HomeTeam = homeTeam,
            SeasonType = seasonType,
            Week = week
        };

    private static GamePrediction BuildPrediction(
        string homeTeam = "Ohio State",
        string awayTeam = "Michigan",
        string predictedWinner = "Ohio State",
        string mySpreadPick = "Ohio State",
        string myOverUnderPick = "Over",
        double? bettingSpread = -3.5,
        double? bettingOverUnder = 45.5) =>
        new()
        {
            AwayTeam = awayTeam,
            BettingOverUnder = bettingOverUnder,
            BettingSpread = bettingSpread,
            HomeTeam = homeTeam,
            MyOverUnderPick = myOverUnderPick,
            MySpreadPick = mySpreadPick,
            PredictedWinner = predictedWinner
        };

    private static List<ScheduleGame> BuildRegularSeasonSchedule() =>
        [new ScheduleGame { Week = 15, SeasonType = "regular", HomeTeam = "Placeholder", AwayTeam = "Placeholder2" }];

    private void SetupRegularSeasonWeek(int season, int week, GamePrediction prediction, Game completedGame)
    {
        var stored = new PredictionsResult
        {
            Season = season,
            Week = week,
            Predictions = [prediction]
        };
        _mockPredictionsModule.Setup(x => x.GetAsync(season, week)).ReturnsAsync(stored);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(season)).ReturnsAsync(BuildRegularSeasonSchedule());
        _mockDataService.Setup(x => x.GetGamesAsync(season, "regular")).ReturnsAsync([completedGame]);
    }
}
