namespace CFBPoll.API.DTOs;

public class GameOverrideDTO
{
    public string AwayTeam { get; set; } = string.Empty;
    public string? AwayTeamLogoURL { get; set; }
    public DateTime CreatedAt { get; set; }
    public long GameID { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public string? HomeTeamLogoURL { get; set; }
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
