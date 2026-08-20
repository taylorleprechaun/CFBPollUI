namespace CFBPoll.Core.Models;

public class SeasonExperimentalPredictionsResult
{
    public RatingAlgorithmVersion AlgorithmVersion { get; set; }
    public PredictionRecordSummary OverallSummary { get; set; } = new();
    public int Season { get; set; }
    public IReadOnlyList<SeasonExperimentalPredictionsWeek> Weeks { get; set; } = [];
}
