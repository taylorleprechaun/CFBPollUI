namespace CFBPoll.API.DTOs;

public class TeamPredictionRecordDTO
{
    public int ActualLosses { get; set; }
    public int ActualWins { get; set; }
    public int GradedGameCount { get; set; }
    public string LogoURL { get; set; } = string.Empty;
    public int PredictedLosses { get; set; }
    public int PredictedWins { get; set; }
    public string TeamName { get; set; } = string.Empty;
}
