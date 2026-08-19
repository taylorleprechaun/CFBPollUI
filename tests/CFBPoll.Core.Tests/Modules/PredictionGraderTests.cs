using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class PredictionGraderTests
{
    [Fact]
    public void BuildMatchKey_CombinesTeamsUppercase_ReturnsExpectedKey()
    {
        var key = PredictionGrader.BuildMatchKey("iowa", "nebraska");

        Assert.Equal("IOWA|NEBRASKA", key);
    }

    [Fact]
    public void Grade_HomeTeamWins_PredictedWinnerMatches_SetsWinnerGradeCorrect()
    {
        var prediction = new GamePrediction { HomeTeam = "Iowa", AwayTeam = "Nebraska", PredictedWinner = "Iowa" };

        PredictionGrader.Grade(prediction, actualHomeScore: 24, actualAwayScore: 10);

        Assert.Equal(24, prediction.ActualHomeScore);
        Assert.Equal(10, prediction.ActualAwayScore);
        Assert.Equal("Iowa", prediction.ActualWinner);
        Assert.Equal(PredictionGradeStatus.Correct, prediction.WinnerGrade);
    }

    [Fact]
    public void Grade_HomeTeamWins_PredictedWinnerDoesNotMatch_SetsWinnerGradeIncorrect()
    {
        var prediction = new GamePrediction { HomeTeam = "Iowa", AwayTeam = "Nebraska", PredictedWinner = "Nebraska" };

        PredictionGrader.Grade(prediction, actualHomeScore: 24, actualAwayScore: 10);

        Assert.Equal(PredictionGradeStatus.Incorrect, prediction.WinnerGrade);
    }

    [Fact]
    public void Grade_TiedScore_SetsWinnerGradeNotApplicable()
    {
        var prediction = new GamePrediction { HomeTeam = "Iowa", AwayTeam = "Nebraska", PredictedWinner = "Iowa" };

        PredictionGrader.Grade(prediction, actualHomeScore: 21, actualAwayScore: 21);

        Assert.Null(prediction.ActualWinner);
        Assert.Equal(PredictionGradeStatus.NotApplicable, prediction.WinnerGrade);
    }

    [Fact]
    public void Grade_NoBettingSpread_SetsSpreadGradeNotApplicable()
    {
        var prediction = new GamePrediction { HomeTeam = "Iowa", AwayTeam = "Nebraska", PredictedWinner = "Iowa", BettingSpread = null };

        PredictionGrader.Grade(prediction, actualHomeScore: 24, actualAwayScore: 10);

        Assert.Null(prediction.ActualSpreadCoveringTeam);
        Assert.Equal(PredictionGradeStatus.NotApplicable, prediction.SpreadGrade);
    }

    [Fact]
    public void Grade_SpreadPush_SetsSpreadGradePush()
    {
        var prediction = new GamePrediction { HomeTeam = "Iowa", AwayTeam = "Nebraska", PredictedWinner = "Iowa", BettingSpread = -7, MySpreadPick = "Iowa" };

        PredictionGrader.Grade(prediction, actualHomeScore: 24, actualAwayScore: 17);

        Assert.Equal("Push", prediction.ActualSpreadCoveringTeam);
        Assert.Equal(PredictionGradeStatus.Push, prediction.SpreadGrade);
    }

    [Fact]
    public void Grade_SpreadCoveredByHomeTeam_PickMatches_SetsSpreadGradeCorrect()
    {
        var prediction = new GamePrediction { HomeTeam = "Iowa", AwayTeam = "Nebraska", PredictedWinner = "Iowa", BettingSpread = -3, MySpreadPick = "Iowa" };

        PredictionGrader.Grade(prediction, actualHomeScore: 24, actualAwayScore: 10);

        Assert.Equal("Iowa", prediction.ActualSpreadCoveringTeam);
        Assert.Equal(PredictionGradeStatus.Correct, prediction.SpreadGrade);
    }

    [Fact]
    public void Grade_SpreadCoveredByAwayTeam_PickDoesNotMatch_SetsSpreadGradeIncorrect()
    {
        var prediction = new GamePrediction { HomeTeam = "Iowa", AwayTeam = "Nebraska", PredictedWinner = "Iowa", BettingSpread = 3, MySpreadPick = "Iowa" };

        PredictionGrader.Grade(prediction, actualHomeScore: 10, actualAwayScore: 20);

        Assert.Equal("Nebraska", prediction.ActualSpreadCoveringTeam);
        Assert.Equal(PredictionGradeStatus.Incorrect, prediction.SpreadGrade);
    }

    [Fact]
    public void Grade_NoBettingOverUnder_SetsOverUnderGradeNotApplicable()
    {
        var prediction = new GamePrediction { HomeTeam = "Iowa", AwayTeam = "Nebraska", PredictedWinner = "Iowa", BettingOverUnder = null };

        PredictionGrader.Grade(prediction, actualHomeScore: 24, actualAwayScore: 10);

        Assert.Null(prediction.ActualOverUnderResult);
        Assert.Equal(PredictionGradeStatus.NotApplicable, prediction.OverUnderGrade);
    }

    [Fact]
    public void Grade_OverUnderPush_SetsOverUnderGradePush()
    {
        var prediction = new GamePrediction { HomeTeam = "Iowa", AwayTeam = "Nebraska", PredictedWinner = "Iowa", BettingOverUnder = 34, MyOverUnderPick = "Over" };

        PredictionGrader.Grade(prediction, actualHomeScore: 24, actualAwayScore: 10);

        Assert.Equal("Push", prediction.ActualOverUnderResult);
        Assert.Equal(PredictionGradeStatus.Push, prediction.OverUnderGrade);
    }

    [Fact]
    public void Grade_ActualTotalOverLine_PickMatches_SetsOverUnderGradeCorrect()
    {
        var prediction = new GamePrediction { HomeTeam = "Iowa", AwayTeam = "Nebraska", PredictedWinner = "Iowa", BettingOverUnder = 30, MyOverUnderPick = "Over" };

        PredictionGrader.Grade(prediction, actualHomeScore: 24, actualAwayScore: 10);

        Assert.Equal("Over", prediction.ActualOverUnderResult);
        Assert.Equal(PredictionGradeStatus.Correct, prediction.OverUnderGrade);
    }

    [Fact]
    public void Grade_ActualTotalUnderLine_PickDoesNotMatch_SetsOverUnderGradeIncorrect()
    {
        var prediction = new GamePrediction { HomeTeam = "Iowa", AwayTeam = "Nebraska", PredictedWinner = "Iowa", BettingOverUnder = 40, MyOverUnderPick = "Over" };

        PredictionGrader.Grade(prediction, actualHomeScore: 24, actualAwayScore: 10);

        Assert.Equal("Under", prediction.ActualOverUnderResult);
        Assert.Equal(PredictionGradeStatus.Incorrect, prediction.OverUnderGrade);
    }
}
