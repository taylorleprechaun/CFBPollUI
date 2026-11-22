namespace CFBPoll.API.DTOs;

public class NewPredictionGameWaitingDTO
{
    public string AwayTeam { get; set; } = string.Empty;
    public string HomeTeam { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
}
