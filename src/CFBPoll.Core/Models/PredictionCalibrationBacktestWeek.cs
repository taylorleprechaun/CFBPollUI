namespace CFBPoll.Core.Models;

/// <summary>
/// One past week's record, recomputed against actual results with the values that week used and with
/// the candidate values.
/// </summary>
public class PredictionCalibrationBacktestWeek
{
    public PredictionRecordSummary Candidate { get; set; } = new();
    public int Season { get; set; }
    public PredictionRecordSummary Used { get; set; } = new();
    public IReadOnlyDictionary<string, double> UsedValues { get; set; } = new Dictionary<string, double>();
    public int Week { get; set; }
}
