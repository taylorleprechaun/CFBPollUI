namespace CFBPoll.API.DTOs;

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
