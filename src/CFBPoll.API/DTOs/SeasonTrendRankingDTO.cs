namespace CFBPoll.API.DTOs;

public class SeasonTrendRankingDTO
{
    public int? Rank { get; set; }
    public double Rating { get; set; }
    public string Record { get; set; } = string.Empty;
    public int WeekNumber { get; set; }
}
