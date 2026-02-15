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

public class ScheduleGameDTO
{
    public DateTime? GameDate { get; set; }
    public bool IsHome { get; set; }
    public bool? IsWin { get; set; }
    public bool NeutralSite { get; set; }
    public string OpponentLogoURL { get; set; } = string.Empty;
    public string OpponentName { get; set; } = string.Empty;
    public int? OpponentRank { get; set; }
    public string OpponentRecord { get; set; } = string.Empty;
    public int? OpponentScore { get; set; }
    public string? SeasonType { get; set; }
    public bool StartTimeTbd { get; set; }
    public int? TeamScore { get; set; }
    public string? Venue { get; set; }
    public int? Week { get; set; }
}
