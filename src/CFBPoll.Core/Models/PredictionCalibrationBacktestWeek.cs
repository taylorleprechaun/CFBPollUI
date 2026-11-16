namespace CFBPoll.Core.Models;

/// <summary>
/// One past week's record, recomputed against actual results with the values that week used, with the
/// values suggested at the time, and with the candidate values when there are any.
/// </summary>
public class PredictionCalibrationBacktestWeek
{
    /// <summary>
    /// The record with the candidate values, or null when no candidate was submitted.
    /// </summary>
    public PredictionRecordSummary? Candidate { get; set; }

    public int Season { get; set; }

    /// <summary>
    /// The record with the values the suggestion would have given for this week, using only games completed before it.
    /// </summary>
    public PredictionRecordSummary Suggested { get; set; } = new();

    public IReadOnlyDictionary<string, double> SuggestedValues { get; set; } = new Dictionary<string, double>();
    public PredictionRecordSummary Used { get; set; } = new();
    public IReadOnlyDictionary<string, double> UsedValues { get; set; } = new Dictionary<string, double>();
    public int Week { get; set; }
}
