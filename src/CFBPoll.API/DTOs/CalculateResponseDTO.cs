namespace CFBPoll.API.DTOs;

public class CalculateResponseDTO
{
    public bool Persisted { get; set; }
    public RankingsResponseDTO Rankings { get; set; } = new();
}
