namespace CFBPoll.API.DTOs;

public class TeamDetailsDTO
{
    public RecordDTO Away { get; set; } = new();
    public RecordDTO Home { get; set; } = new();
    public RecordDTO Neutral { get; set; } = new();
    public RecordDTO VsRank101Plus { get; set; } = new();
    public RecordDTO VsRank11To25 { get; set; } = new();
    public RecordDTO VsRank1To10 { get; set; } = new();
    public RecordDTO VsRank26To50 { get; set; } = new();
    public RecordDTO VsRank51To100 { get; set; } = new();
}
