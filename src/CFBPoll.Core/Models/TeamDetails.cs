namespace CFBPoll.Core.Models;

public class TeamDetails
{
    public Record Away { get; set; } = new();
    public Record Home { get; set; } = new();
    public Record Neutral { get; set; } = new();
    public Record VsRank101Plus { get; set; } = new();
    public Record VsRank11To25 { get; set; } = new();
    public Record VsRank1To10 { get; set; } = new();
    public Record VsRank26To50 { get; set; } = new();
    public Record VsRank51To100 { get; set; } = new();
}
