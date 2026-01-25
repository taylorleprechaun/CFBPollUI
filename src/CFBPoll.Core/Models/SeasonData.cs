namespace CFBPoll.Core.Models;

public class SeasonData
{
    public int Season { get; set; }
    public int Week { get; set; }

    // O(1) team lookup by name (includes games, wins, losses per team)
    public IDictionary<string, TeamInfo> Teams { get; set; } = new Dictionary<string, TeamInfo>();

    // All games for the season up to specified week
    public IEnumerable<Game> Games { get; set; } = [];
}
