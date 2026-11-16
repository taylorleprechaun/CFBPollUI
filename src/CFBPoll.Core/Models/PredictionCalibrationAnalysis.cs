namespace CFBPoll.Core.Models;

/// <summary>
/// Suggested calibration values for a week, and how a candidate set of values would have done over the
/// most recent completed weeks compared with the values actually used.
/// </summary>
public class PredictionCalibrationAnalysis
{
    public IReadOnlyList<PredictionCalibrationBacktestWeek> BacktestWeeks { get; set; } = [];
    public PredictionRecordSummary CandidateTotal { get; set; } = new();

    /// <summary>
    /// The values the backtest evaluated: the submitted values, or the suggestion when none were submitted.
    /// </summary>
    public IReadOnlyDictionary<string, double> CandidateValues { get; set; } = new Dictionary<string, double>();

    /// <summary>
    /// How each suggested value was estimated, keyed by parameter key.
    /// </summary>
    public IReadOnlyDictionary<string, string> SuggestionNotes { get; set; } = new Dictionary<string, string>();

    public IReadOnlyDictionary<string, double> SuggestedValues { get; set; } = new Dictionary<string, double>();
    public PredictionRecordSummary UsedTotal { get; set; } = new();
}
