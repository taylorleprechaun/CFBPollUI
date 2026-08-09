namespace CFBPoll.Core.Models;

public class TrackRecordWeek
{
    public double? MarginBias { get; set; }
    public int MarginGameCount { get; set; }
    public double? MarginRMSE { get; set; }
    public TrackRecordTotals OverUnder { get; set; } = new();
    public int Season { get; set; }
    public TrackRecordTotals Spread { get; set; } = new();
    public int Week { get; set; }
    public TrackRecordTotals Winner { get; set; } = new();
}
