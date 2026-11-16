namespace CFBPoll.Core.Models;

/// <summary>
/// One past week's record, recomputed against actual results with the values that week used, with the
/// values suggested at the time, with every value at its default (no calibration), and with the candidate
/// values when there are any. Each alternative also lists the picks that differ from the used values.
/// </summary>
public class PredictionCalibrationBacktestWeek
{
    /// <summary>
    /// The record with every value at its default, as if no calibration had been applied.
    /// </summary>
    public PredictionRecordSummary Baseline { get; set; } = new();

    public PredictionPickChanges BaselineChanges { get; set; } = new();

    /// <summary>
    /// The record with the candidate values, or null when no candidate was submitted.
    /// </summary>
    public PredictionRecordSummary? Candidate { get; set; }

    public PredictionPickChanges? CandidateChanges { get; set; }
    public int Season { get; set; }

    /// <summary>
    /// The record with the values the suggestion would have given for this week, using only games completed before it.
    /// </summary>
    public PredictionRecordSummary Suggested { get; set; } = new();

    public PredictionPickChanges SuggestedChanges { get; set; } = new();
    public IReadOnlyDictionary<string, double> SuggestedValues { get; set; } = new Dictionary<string, double>();
    public PredictionRecordSummary Used { get; set; } = new();
    public IReadOnlyDictionary<string, double> UsedValues { get; set; } = new Dictionary<string, double>();
    public int Week { get; set; }
}
