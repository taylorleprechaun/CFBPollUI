namespace CFBPoll.Core.Models;

public class PredictionsResult
{
    /// <summary>
    /// Calibration values the predictions were generated with, or null when the algorithm takes none.
    /// </summary>
    public IReadOnlyDictionary<string, double>? AppliedCalibration { get; set; }
    public IReadOnlyList<GamePrediction> Predictions { get; set; } = [];
    public int Season { get; set; }
    public int Week { get; set; }
}
