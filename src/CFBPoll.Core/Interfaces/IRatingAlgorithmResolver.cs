using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Resolves which rating algorithm implementation applies for a given season or explicit version.
/// </summary>
public interface IRatingAlgorithmResolver
{
    /// <summary>
    /// Returns the rating module implementation for an explicitly requested algorithm version.
    /// </summary>
    /// <param name="version">The algorithm version to resolve.</param>
    /// <returns>The rating module implementing the requested version.</returns>
    IRatingModule Resolve(RatingAlgorithmVersion version);

    /// <summary>
    /// Returns the rating module implementation predictions should use, independent of the season-based
    /// rankings cutover.
    /// </summary>
    /// <returns>The rating module predictions are currently pinned to.</returns>
    IRatingModule ResolveForPredictions();

    /// <summary>
    /// Returns the rating module implementation authoritative for the given season.
    /// </summary>
    /// <param name="season">The season to resolve the algorithm version for.</param>
    /// <returns>The rating module authoritative for that season.</returns>
    IRatingModule ResolveForSeason(int season);

    /// <summary>
    /// Determines which algorithm version is authoritative for the given season.
    /// </summary>
    /// <param name="season">The season to resolve.</param>
    /// <returns>The algorithm version authoritative for that season.</returns>
    RatingAlgorithmVersion ResolveVersionForSeason(int season);
}
