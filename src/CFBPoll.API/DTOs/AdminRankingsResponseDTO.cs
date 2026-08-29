namespace CFBPoll.API.DTOs;

public class AdminRankingsResponseDTO
{
    public bool IsPublished { get; set; }
    public RankingsResponseDTO Rankings { get; set; } = new();
}
