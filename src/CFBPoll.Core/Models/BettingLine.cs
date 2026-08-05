namespace CFBPoll.Core.Models;

public class BettingLine
{
    public string AwayTeam { get; set; } = string.Empty;
    public long? GameID { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public double? OverUnderOpen { get; set; }
    public double? SpreadOpen { get; set; }
}
