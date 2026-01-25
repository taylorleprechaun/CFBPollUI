namespace CFBPoll.Core.Models;

public class RankingsResult
{
    public IEnumerable<RankedTeam> Rankings { get; set; } = [];
    public int Season { get; set; }
    public int Week { get; set; }
}
