namespace CFBPoll.Core.Models;

public class CalculateRankingsResult
{
    public bool Persisted { get; set; }
    public RankingsResult Rankings { get; set; } = new();
}
