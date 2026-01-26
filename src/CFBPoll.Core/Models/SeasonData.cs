namespace CFBPoll.Core.Models;

public class SeasonData
{
    public IEnumerable<Game> Games { get; set; } = [];
    public int Season { get; set; }
    public IDictionary<string, TeamInfo> Teams { get; set; } = new Dictionary<string, TeamInfo>();
    public int Week { get; set; }
}
