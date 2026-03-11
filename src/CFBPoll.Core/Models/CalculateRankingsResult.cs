namespace CFBPoll.Core.Models;

public class CalculateRankingsResult
{
    public bool IsPersisted { get; set; }
    public RankingsResult Rankings { get; set; } = new();
}
