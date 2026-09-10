namespace CFBPoll.API.DTOs;

public class SeasonsResponseDTO
{
    public int? LatestPublishedSeason { get; set; }
    public int? NextSeason { get; set; }
    public IEnumerable<int> Seasons { get; set; } = [];
}
