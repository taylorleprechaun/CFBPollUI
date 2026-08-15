namespace CFBPoll.Core.Models;

public class GameTeamStats
{
    public long? GameID { get; set; }
    public IEnumerable<TeamStat> Stats { get; set; } = [];
    public string? Team { get; set; }
}
