namespace CFBPoll.Core.Models;

public class RankingsResult
{
    public DateTime? PublishedAt { get; set; }
    public IEnumerable<RankedTeam> Rankings { get; set; } = [];
    public int Season { get; set; }
    public int Week { get; set; }
}
