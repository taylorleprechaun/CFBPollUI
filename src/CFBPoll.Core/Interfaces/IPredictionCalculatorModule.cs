using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for generating game predictions using a proprietary algorithm.
/// </summary>
public interface IPredictionCalculatorModule
{
    /// <summary>
    /// Generates predictions for upcoming games based on season data, team ratings, and betting lines.
    /// </summary>
    /// <param name="seasonData">The season data containing teams and game results.</param>
    /// <param name="ratings">Dictionary mapping team names to their calculated rating details.</param>
    /// <param name="upcomingGames">The upcoming games to generate predictions for.</param>
    /// <param name="bettingLines">Betting lines for the upcoming games.</param>
    /// <returns>Collection of game predictions.</returns>
    Task<IEnumerable<GamePrediction>> GeneratePredictionsAsync(
        SeasonData seasonData,
        IDictionary<string, RatingDetails> ratings,
        IEnumerable<ScheduleGame> upcomingGames,
        IEnumerable<BettingLine> bettingLines);
}
