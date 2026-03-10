using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Computes season trends data showing how team rankings evolve across a season.
/// </summary>
public interface ISeasonTrendsModule
{
    /// <summary>
    /// Retrieves season trends data for the specified season, including per-team
    /// rank progression across all published weeks.
    /// </summary>
    Task<SeasonTrendsResult> GetSeasonTrendsAsync(int season);

    /// <summary>
    /// Removes all cached season trends data.
    /// </summary>
    Task InvalidateCacheAsync();
}
