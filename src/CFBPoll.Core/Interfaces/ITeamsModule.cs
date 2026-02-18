using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for retrieving detailed team information including rankings and schedule data.
/// </summary>
public interface ITeamsModule
{
    /// <summary>
    /// Retrieves detailed team information for the specified team, season, and week.
    /// </summary>
    /// <param name="teamName">The name of the team.</param>
    /// <param name="season">The season year.</param>
    /// <param name="week">The week number within the season.</param>
    /// <returns>Team detail result, or null if the team is not found.</returns>
    Task<TeamDetailResult?> GetTeamDetailAsync(string teamName, int season, int week);
}
