using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for computing predicted-vs-actual win/loss records per team for a season, derived from
/// graded and published predictions.
/// </summary>
public interface ITeamPredictionRecordModule
{
    /// <summary>
    /// Retrieves the predicted-vs-actual win/loss record for every team with at least one graded,
    /// published prediction in the given season.
    /// </summary>
    Task<IReadOnlyList<TeamPredictionRecord>> GetTeamRecordsAsync(int season);

    /// <summary>
    /// Invalidates all cached team prediction records.
    /// </summary>
    Task InvalidateCacheAsync();
}
