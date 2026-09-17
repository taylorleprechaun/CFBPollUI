namespace CFBPoll.API.DTOs;

public class SaveGameOverrideRequestDTO
{
    public int OverrideAwayPoints { get; set; }
    public int OverrideHomePoints { get; set; }
    public string Reason { get; set; } = string.Empty;
}
