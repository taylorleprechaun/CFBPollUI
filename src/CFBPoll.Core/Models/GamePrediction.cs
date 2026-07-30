namespace CFBPoll.Core.Models;

public class GamePrediction
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
    public PredictionGradeStatus OverUnderGrade { get; set; } = PredictionGradeStatus.Ungraded;
    public double PredictedMargin { get; set; }
    public string PredictedWinner { get; set; } = string.Empty;
    public PredictionGradeStatus SpreadGrade { get; set; } = PredictionGradeStatus.Ungraded;
    public PredictionGradeStatus WinnerGrade { get; set; } = PredictionGradeStatus.Ungraded;
}
