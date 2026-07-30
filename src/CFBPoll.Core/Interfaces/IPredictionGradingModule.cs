using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for grading published predictions against actual game results.
/// </summary>
public interface IPredictionGradingModule
{
    /// <summary>
    /// Grades predictions for the given season and week against actual final scores and persists
    /// the result as a draft. Returns null if no predictions have been generated for the week.
    /// </summary>
    Task<GradePredictionsResult?> GradeAsync(int season, int week);
}
