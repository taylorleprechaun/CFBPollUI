namespace CFBPoll.API.DTOs;

public class RankedTeamDTO
{
    public string Conference { get; set; } = string.Empty;
    public TeamDetailsDTO? Details { get; set; }
    public string Division { get; set; } = string.Empty;
    public string LogoURL { get; set; } = string.Empty;
    public int Losses { get; set; }
    public int Rank { get; set; }
    public int? RankDelta { get; set; }
    public double Rating { get; set; }
    public string Record { get; set; } = string.Empty;
    public int SOSRanking { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public double WeightedSOS { get; set; }
    public int Wins { get; set; }
}
