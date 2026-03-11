namespace CFBPoll.API.DTOs;

public class GamePredictionDTO
{
    public string AwayTeam { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public double HomeWinProbability { get; set; }
    public bool NeutralSite { get; set; }
    public double PredictedMargin { get; set; }
    public string PredictedWinner { get; set; } = string.Empty;
}
