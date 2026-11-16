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
    /// Resolves the values the given season and week would carry forward if it had none of its own: the most
    /// recent earlier values, otherwise the parameter defaults. Ignores any row stored for the week itself.
    /// Values are limited to the given parameters and clamped to their ranges. Nothing is saved.
    /// </summary>
    Task<PredictionCalibration> ResolveCarriedForwardAsync(int season, int week, IEnumerable<PredictionCalibrationParameter> parameters);

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

    /// <summary>
    /// Saves the calibration only when nothing is stored yet for its season and week.
    /// Returns whether it was saved.
    /// </summary>
    Task<bool> SaveIfMissingAsync(PredictionCalibration calibration);
}
