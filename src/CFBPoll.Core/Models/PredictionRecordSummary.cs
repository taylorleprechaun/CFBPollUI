namespace CFBPoll.Core.Models;

public class PredictionRecordSummary
{
    public int GradedGameCount { get; set; }
    public double? MarginBias { get; set; }
    public double? MarginMAE { get; set; }
    public double? MarginRMSE { get; set; }
    public TrackRecordTotals OverUnder { get; set; } = new();
    public TrackRecordTotals Spread { get; set; } = new();
    public TrackRecordTotals Winner { get; set; } = new();
}
