namespace CFBPoll.Core.Models;

public class ScheduleGame
{
    public int? AwayPoints { get; set; }
    public string? AwayTeam { get; set; }
    public string? AwayTeamLogoURL { get; set; }
    public bool Completed { get; set; }
    public long? GameID { get; set; }
    public int? HomePoints { get; set; }
    public string? HomeTeam { get; set; }
    public string? HomeTeamLogoURL { get; set; }
    public bool NeutralSite { get; set; }
    public int? OriginalAwayPoints { get; set; }
    public int? OriginalHomePoints { get; set; }
    public string? ScoreOverrideReason { get; set; }
    public string? SeasonType { get; set; }
    public DateTime? StartDate { get; set; }
    public bool StartTimeTbd { get; set; }
    public string? Venue { get; set; }
    public int? Week { get; set; }
}
