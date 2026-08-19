namespace CFBPoll.Core.Models;

public class ExperimentalPredictionsResult
{
    public RatingAlgorithmVersion AlgorithmVersion { get; set; }
    public IReadOnlyList<GamePrediction> Predictions { get; set; } = [];
    public PredictionRecordSummary Summary { get; set; } = new();
}
