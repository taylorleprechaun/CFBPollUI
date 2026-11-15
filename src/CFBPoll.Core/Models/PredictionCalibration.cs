namespace CFBPoll.Core.Models;

/// <summary>
/// The calibration values applied to one season and week of predictions, keyed by
/// <see cref="PredictionCalibrationParameter.Key"/>.
/// </summary>
public class PredictionCalibration
{
    public int Season { get; set; }
    public PredictionCalibrationSource Source { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public IReadOnlyDictionary<string, double> Values { get; set; } = new Dictionary<string, double>();
    public int Week { get; set; }
}
