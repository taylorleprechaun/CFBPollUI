namespace CFBPoll.Core.Models;

public class PollLeaderEntry
{
    public string LogoURL { get; set; } = string.Empty;
    public string TeamName { get; set; } = string.Empty;
    public int Top5Count { get; set; }
    public int Top10Count { get; set; }
    public int Top25Count { get; set; }
}
