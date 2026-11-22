namespace CFBPoll.Core.Models;

/// <summary>
/// Identifies a game by its teams, in either home/away order.
/// </summary>
public class PredictionGameSelection
{
    public string AwayTeam { get; set; } = string.Empty;
    public string HomeTeam { get; set; } = string.Empty;
}
