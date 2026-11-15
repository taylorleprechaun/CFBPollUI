using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// A prediction calculator whose output can be adjusted by calibration values reviewed and set by an admin.
/// </summary>
public interface ICalibratedPredictionCalculator : IPredictionCalculatorModule
{
    /// <summary>
    /// The calibration values this calculator accepts, with their defaults and allowed ranges.
    /// </summary>
    IReadOnlyList<PredictionCalibrationParameter> CalibrationParameters { get; }

    /// <summary>
    /// Generates predictions for upcoming games with the given calibration values applied.
    /// </summary>
    /// <param name="seasonData">The season data containing teams and game results.</param>
    /// <param name="ratings">Dictionary mapping team names to their calculated rating details.</param>
    /// <param name="upcomingGames">The upcoming games to generate predictions for.</param>
    /// <param name="bettingLines">Betting lines for the upcoming games.</param>
    /// <param name="calibration">Calibration values keyed by parameter key. Missing keys use their defaults.</param>
    /// <returns>Collection of game predictions.</returns>
    Task<IEnumerable<GamePrediction>> GeneratePredictionsAsync(SeasonData seasonData, IDictionary<string, RatingDetails> ratings, IEnumerable<ScheduleGame> upcomingGames, IEnumerable<BettingLine> bettingLines, IReadOnlyDictionary<string, double> calibration);
}
