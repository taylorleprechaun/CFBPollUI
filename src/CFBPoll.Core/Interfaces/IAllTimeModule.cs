using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for computing all-time rankings across all seasons from postseason snapshots.
/// </summary>
public interface IAllTimeModule
{
    /// <summary>
    /// Retrieves all-time rankings including best teams, worst teams, and hardest schedules.
    /// </summary>
    Task<AllTimeResult> GetAllTimeRankingsAsync();
}
