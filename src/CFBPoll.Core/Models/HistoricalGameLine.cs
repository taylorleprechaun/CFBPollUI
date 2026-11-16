namespace CFBPoll.Core.Models;

/// <summary>
/// A completed game's opening betting line, used to evaluate calibration against past games. Matched to
/// a game by <see cref="GameID"/> when present, otherwise by season, game week and teams.
/// </summary>
public class HistoricalGameLine
{
    public string AwayTeam { get; set; } = string.Empty;
    public long? GameID { get; set; }
    public int? GameWeek { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public double? OverUnder { get; set; }
    public int Season { get; set; }
    public double? Spread { get; set; }
}
