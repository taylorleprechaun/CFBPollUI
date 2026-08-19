using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

/// <summary>
/// Tallies win-loss-push records and margin accuracy across a set of graded predictions. Shared by
/// <see cref="TrackRecordModule"/> and anything else summarizing a graded prediction set.
/// </summary>
internal static class PredictionRecordSummarizer
{
    public static double CalculateMarginResidual(GamePrediction game)
    {
        var scoic = StringComparison.OrdinalIgnoreCase;
        var predictedWinnerIsHome = string.Equals(game.PredictedWinner, game.HomeTeam, scoic);
        var actualMarginForPredictedWinner = predictedWinnerIsHome
            ? game.ActualHomeScore!.Value - game.ActualAwayScore!.Value
            : game.ActualAwayScore!.Value - game.ActualHomeScore!.Value;

        return actualMarginForPredictedWinner - game.PredictedMargin;
    }

    public static PredictionRecordSummary Summarize(IEnumerable<GamePrediction> predictions)
    {
        var summary = new PredictionRecordSummary();
        var marginGameCount = 0;
        var marginSumAbsoluteError = 0.0;
        var marginSumResidual = 0.0;
        var marginSumSquaredError = 0.0;

        foreach (var game in predictions)
        {
            Tally(summary.Winner, game.WinnerGrade);
            Tally(summary.Spread, game.SpreadGrade);
            Tally(summary.OverUnder, game.OverUnderGrade);

            if (!game.ActualHomeScore.HasValue || !game.ActualAwayScore.HasValue)
                continue;

            var residual = CalculateMarginResidual(game);
            marginGameCount++;
            marginSumAbsoluteError += Math.Abs(residual);
            marginSumResidual += residual;
            marginSumSquaredError += residual * residual;
        }

        summary.GradedGameCount = marginGameCount;
        summary.MarginBias = marginGameCount > 0 ? marginSumResidual / marginGameCount : null;
        summary.MarginMAE = marginGameCount > 0 ? marginSumAbsoluteError / marginGameCount : null;
        summary.MarginRMSE = marginGameCount > 0 ? Math.Sqrt(marginSumSquaredError / marginGameCount) : null;

        return summary;
    }

    public static void Tally(TrackRecordTotals totals, PredictionGradeStatus grade)
    {
        switch (grade)
        {
            case PredictionGradeStatus.Correct:
                totals.Correct++;
                break;
            case PredictionGradeStatus.Incorrect:
                totals.Incorrect++;
                break;
            case PredictionGradeStatus.Push:
                totals.Push++;
                break;
        }
    }
}
