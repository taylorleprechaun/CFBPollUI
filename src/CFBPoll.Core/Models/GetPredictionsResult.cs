namespace CFBPoll.Core.Models;

public class GetPredictionsResult
{
    public bool IsGraded { get; set; }
    public bool IsPublished { get; set; }
    public PredictionsResult Predictions { get; set; } = new();
    public bool ResultsPublished { get; set; }
}
