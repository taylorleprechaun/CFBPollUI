namespace CFBPoll.Core.Models;

/// <summary>
/// A way a rankings snapshot's embedded score overrides differ from the overrides that currently
/// apply to it.
/// </summary>
public class ScoreOverrideDifference
{
    public string AwayTeam { get; set; } = string.Empty;
    public long GameID { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public ScoreOverrideDifferenceKind Kind { get; set; }
}
