namespace CFBPoll.Core.Models;

public class GetRankingsSnapshotResult
{
    public bool IsPublished { get; set; }
    public RankingsResult Rankings { get; set; } = new();
}
