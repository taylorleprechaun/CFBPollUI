using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for calculating team ratings based on season data.
/// </summary>
public interface IRatingModule
{
    /// <summary>
    /// Calculates ratings for all teams based on the provided season data.
    /// During early-season weeks, blends with previous-season data for stabilization.
    /// </summary>
    /// <param name="seasonData">The season data containing teams and game results.</param>
    /// <returns>Dictionary mapping team names to their calculated rating details.</returns>
    Task<IDictionary<string, RatingDetails>> RateTeamsAsync(SeasonData seasonData);
}
