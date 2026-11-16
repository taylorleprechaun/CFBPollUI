namespace CFBPoll.Core.Models;

public class ExperimentalPredictionsResult
{
    public RatingAlgorithmVersion AlgorithmVersion { get; set; }

    /// <summary>
    /// The calibration values the predictions were generated with, or null when the algorithm takes none.
    /// </summary>
    public IReadOnlyDictionary<string, double>? AppliedCalibration { get; set; }

    public IReadOnlyList<GamePrediction> Predictions { get; set; } = [];
    public PredictionRecordSummary Summary { get; set; } = new();
}
