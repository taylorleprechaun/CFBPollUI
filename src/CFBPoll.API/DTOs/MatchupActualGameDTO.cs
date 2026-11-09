namespace CFBPoll.API.DTOs;

public class MatchupActualGameDTO
{
    public int AwayPoints { get; set; }
    public string AwayTeam { get; set; } = string.Empty;
    public double? BettingOverUnder { get; set; }
    public double? BettingSpread { get; set; }
    public int HomePoints { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public bool NeutralSite { get; set; }
    public bool PlayedAfterPrediction { get; set; }
    public string SeasonType { get; set; } = string.Empty;
    public int? Week { get; set; }
}
