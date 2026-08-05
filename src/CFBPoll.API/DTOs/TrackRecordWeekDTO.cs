namespace CFBPoll.API.DTOs;

public class TrackRecordWeekDTO
{
    public TrackRecordTotalsDTO OverUnder { get; set; } = new();
    public int Season { get; set; }
    public TrackRecordTotalsDTO Spread { get; set; } = new();
    public int Week { get; set; }
    public TrackRecordTotalsDTO Winner { get; set; } = new();
}
