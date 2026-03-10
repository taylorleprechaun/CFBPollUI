namespace CFBPoll.Core.Models;

public class SeasonTrendRanking
{
    public int? Rank { get; set; }
    public double Rating { get; set; }
    public string Record { get; set; } = string.Empty;
    public int WeekNumber { get; set; }
}
