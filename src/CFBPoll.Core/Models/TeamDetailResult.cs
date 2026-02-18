namespace CFBPoll.Core.Models;

public class TeamDetailResult
{
    public IEnumerable<RankedTeam> AllRankings { get; set; } = [];
    public IEnumerable<ScheduleGame> FullSchedule { get; set; } = [];
    public RankedTeam RankedTeam { get; set; } = new();
    public IDictionary<string, TeamInfo> Teams { get; set; } = new Dictionary<string, TeamInfo>();
}
