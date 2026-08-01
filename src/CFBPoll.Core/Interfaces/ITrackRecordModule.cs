using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Aggregates graded prediction results into an all-time and per-week right/wrong/push track record.
/// </summary>
public interface ITrackRecordModule
{
    /// <summary>
    /// Computes the all-time prediction track record from all published, graded, and results-published weeks.
    /// </summary>
    Task<TrackRecordResult> GetTrackRecordAsync();

    /// <summary>
    /// Removes all cached track record data.
    /// </summary>
    Task InvalidateCacheAsync();
}
