namespace CFBPoll.Core.Models;

public class SeasonExperimentalPredictionsWeek
{
    /// <summary>
    /// The calibration values the predictions were generated with, or null when the algorithm takes none.
    /// </summary>
    public IReadOnlyDictionary<string, double>? AppliedCalibration { get; set; }

    public PredictionRecordSummary Summary { get; set; } = new();
    public int Week { get; set; }
}
