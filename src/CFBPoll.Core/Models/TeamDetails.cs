namespace CFBPoll.Core.Models;

public record TeamDetails
{
    public Record Away { get; init; } = new();
    public Record Home { get; init; } = new();
    public Record Neutral { get; init; } = new();
    public Record VsRank101Plus { get; init; } = new();
    public Record VsRank11To25 { get; init; } = new();
    public Record VsRank1To10 { get; init; } = new();
    public Record VsRank26To50 { get; init; } = new();
    public Record VsRank51To100 { get; init; } = new();
}
