namespace CFBPoll.Core.Models;

public class SnapshotSummary
{
    public DateTime CreatedAt { get; set; }
    public bool IsPublished { get; set; }
    public int Season { get; set; }
    public int Week { get; set; }
}
