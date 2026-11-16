namespace CFBPoll.Core.Models;

/// <summary>
/// Describes one calibration value a prediction algorithm accepts. Supplied by the algorithm so that
/// callers can display, validate and default values without knowing what they mean. Immutable, since an
/// algorithm's definitions are shared by every caller.
/// </summary>
public class PredictionCalibrationParameter
{
    /// <summary>
    /// Whether a value carried forward into a new season keeps last season's value. When false, the first
    /// week of a season without its own values starts from <see cref="DefaultValue"/> instead.
    /// </summary>
    public bool CarriesAcrossSeasons { get; init; } = true;

    public double DefaultValue { get; init; }
    public string Description { get; init; } = string.Empty;
    public string Key { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public double Max { get; init; }
    public double Min { get; init; }
    public double Step { get; init; }
}
