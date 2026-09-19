namespace CFBPoll.API.DTOs;

public class StaleScoreOverrideDTO
{
    public string AwayTeam { get; set; } = string.Empty;
    public long GameID { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
}
