namespace CFBPoll.Core.Models;

public class TrackRecordResult
{
    public double? OverallMarginBias { get; set; }
    public double? OverallMarginRMSE { get; set; }
    public TrackRecordTotals OverallOverUnder { get; set; } = new();
    public TrackRecordTotals OverallSpread { get; set; } = new();
    public TrackRecordTotals OverallWinner { get; set; } = new();
    public IReadOnlyList<TrackRecordWeek> Weeks { get; set; } = [];
}
