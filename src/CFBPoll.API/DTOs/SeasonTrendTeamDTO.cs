namespace CFBPoll.API.DTOs;

public class SeasonTrendTeamDTO
{
    public string AltColor { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Conference { get; set; } = string.Empty;
    public string LogoURL { get; set; } = string.Empty;
    public IEnumerable<SeasonTrendRankingDTO> Rankings { get; set; } = [];
    public string TeamName { get; set; } = string.Empty;
}
