namespace CFBPoll.Core.Models;

/// <summary>
/// The calibration that applies to one season and week, with its editing state.
/// </summary>
public class PredictionCalibrationView
{
    /// <summary>
    /// The effective calibration: the stored row, or the carried-forward values when nothing is stored.
    /// Null when the season's algorithm takes no calibration.
    /// </summary>
    public PredictionCalibration? Calibration { get; set; }

    /// <summary>
    /// True when the week's saved predictions (draft or published) were generated with different values than
    /// the ones that now apply. On a published week this means the shown values aren't what was published.
    /// </summary>
    public bool DraftUsesDifferentValues { get; set; }

    /// <summary>
    /// True once the week's predictions are published, after which its calibration can't be edited.
    /// </summary>
    public bool IsLocked { get; set; }

    public bool IsStored { get; set; }
    public bool IsSupported { get; set; }
    public IReadOnlyList<PredictionCalibrationParameter> Parameters { get; set; } = [];
    public int Season { get; set; }
    public int Week { get; set; }
}
