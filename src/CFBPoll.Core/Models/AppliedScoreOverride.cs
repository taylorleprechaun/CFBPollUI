namespace CFBPoll.Core.Models;

/// <summary>
/// A manual score override that was in effect for the games a set of rankings was calculated from.
/// Stored inside the rankings snapshot so what the poll discloses matches what it actually used,
/// regardless of later changes to the override table.
/// </summary>
public class AppliedScoreOverride
{
    public string AwayTeam { get; set; } = string.Empty;
    public string? AwayTeamLogoURL { get; set; }
    public long GameID { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public string? HomeTeamLogoURL { get; set; }
    public int OriginalAwayPoints { get; set; }
    public int OriginalHomePoints { get; set; }
    public int OverrideAwayPoints { get; set; }
    public int OverrideHomePoints { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string SeasonType { get; set; } = string.Empty;
    public int Week { get; set; }
}
