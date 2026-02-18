namespace CFBPoll.Core.Models;

public class RankedTeam
{
    public string Conference { get; set; } = string.Empty;
    public TeamDetails Details { get; set; } = new();
    public string Division { get; set; } = string.Empty;
    public string LogoURL { get; set; } = string.Empty;
    public int Losses { get; set; }
    public int Rank { get; set; }
    public double Rating { get; set; }
    public IDictionary<string, double> RatingComponents { get; set; } = new Dictionary<string, double>();
    public int SOSRanking { get; set; }
    public double StrengthOfSchedule { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public double WeightedSOS { get; set; }
    public int Wins { get; set; }
}
