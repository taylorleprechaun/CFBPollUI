namespace CFBPoll.API.DTOs;

public class CalculateResponseDTO
{
    public bool IsPersisted { get; set; }
    public RankingsResponseDTO Rankings { get; set; } = new();
}
