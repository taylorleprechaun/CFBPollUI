namespace CFBPoll.API.DTOs;

public class SeasonsResponseDTO
{
    public int? NextSeason { get; set; }
    public IEnumerable<int> Seasons { get; set; } = [];
}
