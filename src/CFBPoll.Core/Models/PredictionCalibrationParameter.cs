namespace CFBPoll.Core.Models;

/// <summary>
/// Describes one calibration value a prediction algorithm accepts. Supplied by the algorithm so that
/// callers can display, validate and default values without knowing what they mean.
/// </summary>
public class PredictionCalibrationParameter
{
    public double DefaultValue { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public double Max { get; set; }
    public double Min { get; set; }
    public double Step { get; set; }
}
