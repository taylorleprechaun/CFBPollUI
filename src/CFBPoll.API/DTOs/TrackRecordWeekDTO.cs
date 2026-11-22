namespace CFBPoll.API.DTOs;

public class TrackRecordWeekDTO
{
    public int GameCount { get; set; }
    public double? MarginBias { get; set; }
    public int MarginGameCount { get; set; }
    public double? MarginRMSE { get; set; }
    public TrackRecordTotalsDTO OverUnder { get; set; } = new();
    public int Season { get; set; }
    public TrackRecordTotalsDTO Spread { get; set; } = new();
    public int Week { get; set; }
    public TrackRecordTotalsDTO Winner { get; set; } = new();
}
