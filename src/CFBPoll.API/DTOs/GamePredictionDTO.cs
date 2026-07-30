namespace CFBPoll.API.DTOs;

public class GamePredictionDTO
{
    public int? ActualAwayScore { get; set; }
    public int? ActualHomeScore { get; set; }
    public string? ActualOverUnderResult { get; set; }
    public string? ActualSpreadCoveringTeam { get; set; }
    public string? ActualWinner { get; set; }
    public string AwayLogoURL { get; set; } = string.Empty;
    public string AwayTeam { get; set; } = string.Empty;
    public int AwayTeamScore { get; set; }
    public double? BettingOverUnder { get; set; }
    public double? BettingSpread { get; set; }
    public string HomeLogoURL { get; set; } = string.Empty;
    public string HomeTeam { get; set; } = string.Empty;
    public int HomeTeamScore { get; set; }
    public string MyOverUnderPick { get; set; } = string.Empty;
    public string MySpreadPick { get; set; } = string.Empty;
    public bool NeutralSite { get; set; }
    public string OverUnderGrade { get; set; } = string.Empty;
    public double PredictedMargin { get; set; }
    public string PredictedWinner { get; set; } = string.Empty;
    public string SpreadGrade { get; set; } = string.Empty;
    public string WinnerGrade { get; set; } = string.Empty;
}
