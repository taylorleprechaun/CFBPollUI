namespace CFBPoll.Core.Models;

public class AllTimeResult
{
    public IEnumerable<AllTimeEntry> BestTeams { get; set; } = [];
    public IEnumerable<AllTimeEntry> HardestSchedules { get; set; } = [];
    public IEnumerable<AllTimeEntry> WorstTeams { get; set; } = [];
}
