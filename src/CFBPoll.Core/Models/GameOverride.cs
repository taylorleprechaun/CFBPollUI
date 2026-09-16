namespace CFBPoll.Core.Models;

public class GameOverride
{
    public string AwayTeam { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public long GameID { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public DateTime ModifiedAt { get; set; }
    public int OriginalAwayPoints { get; set; }
    public int OriginalHomePoints { get; set; }
    public int OverrideAwayPoints { get; set; }
    public int OverrideHomePoints { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int Season { get; set; }
    public string SeasonType { get; set; } = string.Empty;
    public int Week { get; set; }
}
