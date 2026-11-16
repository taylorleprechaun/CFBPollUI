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
    /// Suggests calibration values for the week after <paramref name="seasonData"/>'s completed games, and
    /// grades a candidate set of values against the most recent completed weeks' actual results alongside
    /// the values those weeks used.
    /// </summary>
    /// <param name="seasonData">The season data for the week being calibrated, including its completed games.</param>
    /// <param name="lines">Opening lines for completed games in this and recent prior seasons.</param>
    /// <param name="appliedByWeek">The values each of this season's prediction weeks was generated with, keyed by week.</param>
    /// <param name="candidate">Values to evaluate, or null to evaluate the suggestion.</param>
    /// <param name="backtestWeeks">How many of the most recent completed prediction weeks to grade.</param>
    Task<PredictionCalibrationAnalysis> AnalyzeCalibrationAsync(SeasonData seasonData, IEnumerable<HistoricalGameLine> lines, IReadOnlyDictionary<int, IReadOnlyDictionary<string, double>> appliedByWeek, IReadOnlyDictionary<string, double>? candidate, int backtestWeeks);

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
