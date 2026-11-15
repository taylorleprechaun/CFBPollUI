using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for managing the calibration values applied to predictions each week.
/// </summary>
public interface IPredictionCalibrationModule
{
    /// <summary>
    /// Retrieves the calibration stored for the given season and week, normalized to the given parameters.
    /// </summary>
    Task<PredictionCalibration?> GetAsync(int season, int week, IEnumerable<PredictionCalibrationParameter> parameters);

    /// <summary>
    /// Retrieves every calibration stored for the given season, in week order, as stored.
    /// </summary>
    Task<IEnumerable<PredictionCalibration>> GetSeasonAsync(int season);

    /// <summary>
    /// Resolves the calibration that applies to the given season and week: the stored values if present,
    /// otherwise the most recent earlier values carried forward, otherwise the parameter defaults.
    /// Values are limited to the given parameters and clamped to their ranges. Nothing is saved.
    /// </summary>
    Task<PredictionCalibration> ResolveEffectiveAsync(int season, int week, IEnumerable<PredictionCalibrationParameter> parameters);

    /// <summary>
    /// Saves the calibration for its season and week, replacing any existing one.
    /// </summary>
    Task<bool> SaveAsync(PredictionCalibration calibration);
}
