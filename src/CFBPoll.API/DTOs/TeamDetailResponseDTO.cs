namespace CFBPoll.API.DTOs;

public class TeamDetailResponseDTO
{
    public string AltColor { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Conference { get; set; } = string.Empty;
    public TeamDetailsDTO Details { get; set; } = new();
    public string Division { get; set; } = string.Empty;
    public string LogoURL { get; set; } = string.Empty;
    public int Rank { get; set; }
    public double Rating { get; set; }
    public string Record { get; set; } = string.Empty;
    public IEnumerable<ScheduleGameDTO> Schedule { get; set; } = [];
    public int SOSRanking { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public double WeightedSOS { get; set; }
}
