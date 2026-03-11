namespace CFBPoll.Core.Models;

public class CalculatePredictionsResult
{
    public bool IsPersisted { get; set; }
    public PredictionsResult Predictions { get; set; } = new();
}
