using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for generating complete rankings from team ratings.
/// </summary>
public interface IRankingsModule
{
    /// <summary>
    /// Generates complete rankings from season data and calculated ratings.
    /// </summary>
    /// <param name="seasonData">The season data containing teams and game results.</param>
    /// <param name="ratings">Dictionary mapping team names to their calculated rating details.</param>
    /// <returns>Rankings result containing all ranked teams.</returns>
    Task<RankingsResult> GenerateRankingsAsync(SeasonData seasonData, IDictionary<string, RatingDetails> ratings);
}
