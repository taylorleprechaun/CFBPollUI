namespace CFBPoll.Core.Models;

public class SeasonTrendsResult
{
    public int Season { get; set; }
    public IEnumerable<SeasonTrendTeam> Teams { get; set; } = [];
    public IEnumerable<SeasonTrendWeek> Weeks { get; set; } = [];
}
