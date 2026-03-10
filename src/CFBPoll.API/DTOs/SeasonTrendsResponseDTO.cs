namespace CFBPoll.API.DTOs;

public class SeasonTrendsResponseDTO
{
    public int Season { get; set; }
    public IEnumerable<SeasonTrendTeamDTO> Teams { get; set; } = [];
    public IEnumerable<SeasonTrendWeekDTO> Weeks { get; set; } = [];
}
