namespace CFBPoll.Core.Models;

/// <summary>
/// Suggested calibration values for a week, and how each completed week of the season did with the values it
/// used compared with the values suggested at the time and, optionally, a candidate set of values.
/// </summary>
public class PredictionCalibrationAnalysis
{
    /// <summary>
    /// Every completed prediction week of the season, oldest first.
    /// </summary>
    public IReadOnlyList<PredictionCalibrationBacktestWeek> BacktestWeeks { get; set; } = [];

    /// <summary>
    /// The submitted values each week was also graded with, or null when none were submitted.
    /// </summary>
    public IReadOnlyDictionary<string, double>? CandidateValues { get; set; }

    /// <summary>
    /// How each suggested value was estimated, keyed by parameter key.
    /// </summary>
    public IReadOnlyDictionary<string, string> SuggestionNotes { get; set; } = new Dictionary<string, string>();

    public IReadOnlyDictionary<string, double> SuggestedValues { get; set; } = new Dictionary<string, double>();
}
