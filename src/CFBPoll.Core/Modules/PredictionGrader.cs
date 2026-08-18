using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

/// <summary>
/// Grades a single prediction against an actual final score. Shared by <see cref="PredictionGradingModule"/>
/// and anything else that needs to grade a prediction without persisting it.
/// </summary>
internal static class PredictionGrader
{
    private const string OVER_RESULT = "Over";
    private const string PUSH_RESULT = "Push";
    private const string UNDER_RESULT = "Under";

    public static string BuildMatchKey(string homeTeam, string awayTeam) =>
        $"{homeTeam}|{awayTeam}".ToUpperInvariant();

    public static void Grade(GamePrediction prediction, int actualHomeScore, int actualAwayScore)
    {
        var scoic = StringComparison.OrdinalIgnoreCase;

        prediction.ActualHomeScore = actualHomeScore;
        prediction.ActualAwayScore = actualAwayScore;

        if (actualHomeScore == actualAwayScore)
        {
            prediction.ActualWinner = null;
            prediction.WinnerGrade = PredictionGradeStatus.NotApplicable;
        }
        else
        {
            prediction.ActualWinner = actualHomeScore > actualAwayScore ? prediction.HomeTeam : prediction.AwayTeam;
            prediction.WinnerGrade = string.Equals(prediction.PredictedWinner, prediction.ActualWinner, scoic)
                ? PredictionGradeStatus.Correct
                : PredictionGradeStatus.Incorrect;
        }

        if (!prediction.BettingSpread.HasValue)
        {
            prediction.ActualSpreadCoveringTeam = null;
            prediction.SpreadGrade = PredictionGradeStatus.NotApplicable;
        }
        else
        {
            var homeAdjusted = actualHomeScore + prediction.BettingSpread.Value;

            prediction.ActualSpreadCoveringTeam = homeAdjusted > actualAwayScore
                ? prediction.HomeTeam
                : homeAdjusted < actualAwayScore
                    ? prediction.AwayTeam
                    : PUSH_RESULT;

            prediction.SpreadGrade = prediction.ActualSpreadCoveringTeam == PUSH_RESULT
                ? PredictionGradeStatus.Push
                : string.Equals(prediction.MySpreadPick, prediction.ActualSpreadCoveringTeam, scoic)
                    ? PredictionGradeStatus.Correct
                    : PredictionGradeStatus.Incorrect;
        }

        if (!prediction.BettingOverUnder.HasValue)
        {
            prediction.ActualOverUnderResult = null;
            prediction.OverUnderGrade = PredictionGradeStatus.NotApplicable;
        }
        else
        {
            var actualTotal = actualHomeScore + actualAwayScore;

            prediction.ActualOverUnderResult = actualTotal > prediction.BettingOverUnder.Value
                ? OVER_RESULT
                : actualTotal < prediction.BettingOverUnder.Value
                    ? UNDER_RESULT
                    : PUSH_RESULT;

            prediction.OverUnderGrade = prediction.ActualOverUnderResult == PUSH_RESULT
                ? PredictionGradeStatus.Push
                : string.Equals(prediction.MyOverUnderPick, prediction.ActualOverUnderResult, scoic)
                    ? PredictionGradeStatus.Correct
                    : PredictionGradeStatus.Incorrect;
        }
    }
}
