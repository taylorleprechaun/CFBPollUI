namespace CFBPoll.Core.Models;

public class SavePredictionCalibrationResult
{
    /// <summary>
    /// Why the values were rejected, when <see cref="Outcome"/> is <see cref="SavePredictionCalibrationOutcome.InvalidValues"/>.
    /// </summary>
    public string? ErrorMessage { get; set; }

    public SavePredictionCalibrationOutcome Outcome { get; set; }
}
