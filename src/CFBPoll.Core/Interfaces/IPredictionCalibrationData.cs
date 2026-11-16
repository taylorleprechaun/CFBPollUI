using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Data access for persisted prediction calibration values.
/// </summary>
public interface IPredictionCalibrationData
{
    /// <summary>
    /// Retrieves the calibration stored for the given season and week.
    /// </summary>
    Task<PredictionCalibration?> GetAsync(int season, int week);

    /// <summary>
    /// Retrieves the most recent calibration stored before the given season and week, across seasons.
    /// </summary>
    Task<PredictionCalibration?> GetLatestBeforeAsync(int season, int week);

    /// <summary>
    /// Retrieves every calibration stored for the given season, in week order.
    /// </summary>
    Task<IEnumerable<PredictionCalibration>> GetSeasonAsync(int season);

    /// <summary>
    /// Creates the database table if it does not exist.
    /// </summary>
    Task InitializeAsync();

    /// <summary>
    /// Saves the calibration for its season and week, replacing any existing one.
    /// </summary>
    Task<bool> SaveAsync(PredictionCalibration calibration);

    /// <summary>
    /// Saves the calibration only when nothing is stored yet for its season and week.
    /// Returns whether it was saved.
    /// </summary>
    Task<bool> SaveIfMissingAsync(PredictionCalibration calibration);
}
