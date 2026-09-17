namespace CFBPoll.API.DTOs;

public class ScoreOverrideDisclosureDTO
{
    public string AwayTeam { get; set; } = string.Empty;
    public long GameID { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public int Week { get; set; }
}
