namespace CFBPoll.Core.Models;

public class TrackRecordWeek
{
    public TrackRecordTotals OverUnder { get; set; } = new();
    public int Season { get; set; }
    public TrackRecordTotals Spread { get; set; } = new();
    public int Week { get; set; }
    public TrackRecordTotals Winner { get; set; } = new();
}
