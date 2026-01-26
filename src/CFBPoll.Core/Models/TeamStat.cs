namespace CFBPoll.Core.Models;

public class TeamStat
{
    public string StatName { get; set; } = string.Empty;
    public StatValue StatValue { get; set; } = new();
}