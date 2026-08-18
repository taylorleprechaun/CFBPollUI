using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Resolves which prediction algorithm implementation applies for a given season or explicit version.
/// </summary>
public interface IPredictionAlgorithmResolver
{
    /// <summary>
    /// Returns the prediction calculator for an explicitly requested algorithm version.
    /// </summary>
    IPredictionCalculatorModule Resolve(RatingAlgorithmVersion version);

    /// <summary>
    /// Returns the prediction calculator authoritative for the given season.
    /// </summary>
    IPredictionCalculatorModule ResolveForSeason(int season);

    /// <summary>
    /// Which algorithm version is authoritative for the given season.
    /// </summary>
    RatingAlgorithmVersion ResolveVersionForSeason(int season);
}
