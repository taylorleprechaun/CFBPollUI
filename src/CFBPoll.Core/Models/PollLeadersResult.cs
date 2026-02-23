namespace CFBPoll.Core.Models;

public class PollLeadersResult
{
    public IEnumerable<PollLeaderEntry> AllWeeks { get; set; } = [];
    public IEnumerable<PollLeaderEntry> FinalWeeksOnly { get; set; } = [];
    public int MaxAvailableSeason { get; set; }
    public int MinAvailableSeason { get; set; }
}
