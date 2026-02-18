namespace CFBPoll.Core.Models;

public class PersistedWeekSummary
{
    public DateTime CreatedAt { get; set; }
    public bool Published { get; set; }
    public int Season { get; set; }
    public int Week { get; set; }
}
