namespace CFBPoll.Core.Models;

public class GradePredictionsResult
{
    public bool IsPersisted { get; set; }
    public PredictionsResult Predictions { get; set; } = new();
    public int UnmatchedGameCount { get; set; }
}
