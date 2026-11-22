namespace CFBPoll.Core.Models;

public class GradePredictionsResult
{
    public bool IsPersisted { get; set; }
    public PredictionsResult Predictions { get; set; } = new();
    public bool ResultsPublished { get; set; }
    public int UnmatchedGameCount { get; set; }
}
