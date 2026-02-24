using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Aggregates rankings data across published snapshots to compute per-team appearance counts.
/// </summary>
public interface IPollLeadersModule
{
    /// <summary>
    /// Computes poll leader statistics for the given season range, returning both
    /// all-weeks and final-weeks-only aggregations.
    /// </summary>
    Task<PollLeadersResult> GetPollLeadersAsync(int? minSeason, int? maxSeason);

    /// <summary>
    /// Removes all cached poll leaders data.
    /// </summary>
    Task InvalidateCacheAsync();
}
