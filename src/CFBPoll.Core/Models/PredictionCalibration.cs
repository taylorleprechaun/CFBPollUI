namespace CFBPoll.Core.Models;

/// <summary>
/// The calibration values applied to one season and week of predictions, keyed by
/// <see cref="PredictionCalibrationParameter.Key"/>.
/// </summary>
public class PredictionCalibration
{
    /// <summary>
    /// For carried-forward values, the season of the week whose values were carried forward. Null when the
    /// values were set directly or are the defaults because nothing earlier was saved.
    /// </summary>
    public int? CarriedFromSeason { get; set; }

    /// <summary>
    /// For carried-forward values, the week whose values were carried forward. See <see cref="CarriedFromSeason"/>.
    /// </summary>
    public int? CarriedFromWeek { get; set; }

    public int Season { get; set; }
    public PredictionCalibrationSource Source { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public IReadOnlyDictionary<string, double> Values { get; set; } = new Dictionary<string, double>();
    public int Week { get; set; }
}
