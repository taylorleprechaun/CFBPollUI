namespace CFBPoll.Core.Models;

public class WeekInfo
{
    public bool IsComplete { get; set; }
    public string Label { get; set; } = string.Empty;
    public int WeekNumber { get; set; }
}
