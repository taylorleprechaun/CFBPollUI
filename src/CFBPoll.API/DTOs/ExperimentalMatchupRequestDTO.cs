namespace CFBPoll.API.DTOs;

public class ExperimentalMatchupRequestDTO
{
    public string AwayTeam { get; set; } = string.Empty;
    public string HomeTeam { get; set; } = string.Empty;
    public bool NeutralSite { get; set; }
}
