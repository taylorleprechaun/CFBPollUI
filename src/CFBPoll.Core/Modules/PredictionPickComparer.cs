using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

/// <summary>
/// Compares two graded prediction sets for the same games, pick by pick, so a difference in records can be
/// read as "this many picks changed, and this is how they split".
/// </summary>
internal static class PredictionPickComparer
{
    /// <summary>
    /// Pairs the games by position, so both lists must hold the same games in the same order.
    /// </summary>
    public static PredictionPickChanges Compare(IReadOnlyList<GamePrediction> used, IReadOnlyList<GamePrediction> compared)
    {
        ArgumentNullException.ThrowIfNull(used);
        ArgumentNullException.ThrowIfNull(compared);
        if (used.Count != compared.Count)
            throw new ArgumentException("Both prediction sets must cover the same games.", nameof(compared));

        var changes = new PredictionPickChanges();

        for (var i = 0; i < used.Count; i++)
        {
            Tally(changes.OverUnder, used[i].MyOverUnderPick, used[i].OverUnderGrade, compared[i].MyOverUnderPick, compared[i].OverUnderGrade);
            Tally(changes.Spread, used[i].MySpreadPick, used[i].SpreadGrade, compared[i].MySpreadPick, compared[i].SpreadGrade);
            Tally(changes.Winner, used[i].PredictedWinner, used[i].WinnerGrade, compared[i].PredictedWinner, compared[i].WinnerGrade);
        }

        return changes;
    }

    private static bool IsGraded(PredictionGradeStatus grade) =>
        grade is PredictionGradeStatus.Correct or PredictionGradeStatus.Incorrect or PredictionGradeStatus.Push;

    private static void Tally(PredictionPickChange change, string usedPick, PredictionGradeStatus usedGrade, string comparedPick, PredictionGradeStatus comparedGrade)
    {
        if (!IsGraded(usedGrade) || !IsGraded(comparedGrade))
            return;

        if (string.Equals(usedPick, comparedPick, StringComparison.OrdinalIgnoreCase))
            return;

        change.Changed++;
        if (usedGrade == PredictionGradeStatus.Correct)
            change.UsedCorrect++;
        if (comparedGrade == PredictionGradeStatus.Correct)
            change.ComparedCorrect++;
    }
}
