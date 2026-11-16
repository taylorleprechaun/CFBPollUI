namespace CFBPoll.Core.Models;

public class AnalyzePredictionCalibrationResult
{
    /// <summary>
    /// The analysis, when <see cref="Outcome"/> is <see cref="AnalyzePredictionCalibrationOutcome.Success"/>.
    /// </summary>
    public PredictionCalibrationAnalysis? Analysis { get; set; }

    /// <summary>
    /// Why the request was rejected, when <see cref="Outcome"/> is <see cref="AnalyzePredictionCalibrationOutcome.InvalidValues"/>.
    /// </summary>
    public string? ErrorMessage { get; set; }

    public AnalyzePredictionCalibrationOutcome Outcome { get; set; }
}
