using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class PredictionRecordSummarizerTests
{
    [Fact]
    public void CalculateMarginResidual_PredictedWinnerIsAway_ReturnsActualMarginMinusPredicted()
    {
        var game = new GamePrediction
        {
            HomeTeam = "Iowa",
            AwayTeam = "Nebraska",
            PredictedWinner = "Nebraska",
            PredictedMargin = 5,
            ActualHomeScore = 10,
            ActualAwayScore = 24
        };

        var residual = PredictionRecordSummarizer.CalculateMarginResidual(game);

        Assert.Equal(9, residual);
    }

    [Fact]
    public void CalculateMarginResidual_PredictedWinnerIsHome_ReturnsActualMarginMinusPredicted()
    {
        var game = new GamePrediction
        {
            HomeTeam = "Iowa",
            AwayTeam = "Nebraska",
            PredictedWinner = "Iowa",
            PredictedMargin = 7,
            ActualHomeScore = 24,
            ActualAwayScore = 10
        };

        var residual = PredictionRecordSummarizer.CalculateMarginResidual(game);

        Assert.Equal(7, residual);
    }

    [Fact]
    public void Summarize_EmptyPredictions_ReturnsZeroedSummary()
    {
        var summary = PredictionRecordSummarizer.Summarize([]);

        Assert.Equal(0, summary.GradedGameCount);
        Assert.Null(summary.MarginBias);
        Assert.Null(summary.MarginMAE);
        Assert.Null(summary.MarginRMSE);
        Assert.Equal(0, summary.Winner.Correct + summary.Winner.Incorrect + summary.Winner.Push);
    }

    [Fact]
    public void Summarize_MixOfGradedAndUngradedGames_OnlyCountsGradedGamesInMarginStats()
    {
        var graded = new GamePrediction
        {
            HomeTeam = "Iowa",
            AwayTeam = "Nebraska",
            PredictedWinner = "Iowa",
            PredictedMargin = 7,
            ActualHomeScore = 24,
            ActualAwayScore = 10,
            WinnerGrade = PredictionGradeStatus.Correct,
            SpreadGrade = PredictionGradeStatus.Push,
            OverUnderGrade = PredictionGradeStatus.Incorrect
        };
        var ungraded = new GamePrediction
        {
            HomeTeam = "Michigan",
            AwayTeam = "Ohio State",
            PredictedWinner = "Michigan",
            WinnerGrade = PredictionGradeStatus.Ungraded,
            SpreadGrade = PredictionGradeStatus.Ungraded,
            OverUnderGrade = PredictionGradeStatus.Ungraded
        };

        var summary = PredictionRecordSummarizer.Summarize([graded, ungraded]);

        Assert.Equal(1, summary.GradedGameCount);
        Assert.Equal(1, summary.Winner.Correct);
        Assert.Equal(1, summary.Spread.Push);
        Assert.Equal(1, summary.OverUnder.Incorrect);
        Assert.Equal(7, summary.MarginBias);
        Assert.Equal(7, summary.MarginMAE);
        Assert.Equal(7, summary.MarginRMSE);
    }

    [Fact]
    public void Summarize_SeveralGradedGames_ComputesBiasMaeRmseAcrossAllOfThem()
    {
        var gameOne = new GamePrediction
        {
            HomeTeam = "Iowa",
            AwayTeam = "Nebraska",
            PredictedWinner = "Iowa",
            PredictedMargin = 7,
            ActualHomeScore = 24,
            ActualAwayScore = 10
        };
        var gameTwo = new GamePrediction
        {
            HomeTeam = "Michigan",
            AwayTeam = "Ohio State",
            PredictedWinner = "Michigan",
            PredictedMargin = 10,
            ActualHomeScore = 17,
            ActualAwayScore = 20
        };

        var summary = PredictionRecordSummarizer.Summarize([gameOne, gameTwo]);

        Assert.Equal(2, summary.GradedGameCount);
        Assert.Equal(-3, summary.MarginBias);
        Assert.Equal(10, summary.MarginMAE);
    }

    [Fact]
    public void Tally_Correct_IncrementsCorrectCounter()
    {
        var totals = new TrackRecordTotals();

        PredictionRecordSummarizer.Tally(totals, PredictionGradeStatus.Correct);

        Assert.Equal(1, totals.Correct);
        Assert.Equal(0, totals.Incorrect);
        Assert.Equal(0, totals.Push);
    }

    [Fact]
    public void Tally_Incorrect_IncrementsIncorrectCounter()
    {
        var totals = new TrackRecordTotals();

        PredictionRecordSummarizer.Tally(totals, PredictionGradeStatus.Incorrect);

        Assert.Equal(1, totals.Incorrect);
    }

    [Fact]
    public void Tally_NotApplicable_DoesNotIncrementAnyCounter()
    {
        var totals = new TrackRecordTotals();

        PredictionRecordSummarizer.Tally(totals, PredictionGradeStatus.NotApplicable);

        Assert.Equal(0, totals.Correct + totals.Incorrect + totals.Push);
    }

    [Fact]
    public void Tally_Push_IncrementsPushCounter()
    {
        var totals = new TrackRecordTotals();

        PredictionRecordSummarizer.Tally(totals, PredictionGradeStatus.Push);

        Assert.Equal(1, totals.Push);
    }

    [Fact]
    public void Tally_Ungraded_DoesNotIncrementAnyCounter()
    {
        var totals = new TrackRecordTotals();

        PredictionRecordSummarizer.Tally(totals, PredictionGradeStatus.Ungraded);

        Assert.Equal(0, totals.Correct + totals.Incorrect + totals.Push);
    }
}
