namespace CFBPoll.API.DTOs;

public class IncompleteGameDTO
{
    public string? AwayTeam { get; set; }
    public string? HomeTeam { get; set; }
    public DateTime? StartDate { get; set; }
    public bool StartTimeTbd { get; set; }
}
