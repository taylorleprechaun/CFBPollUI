using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

/// <summary>
/// Shared handling of calibration value sets against a calculator's parameter definitions.
/// </summary>
internal static class PredictionCalibrationValues
{
    /// <summary>
    /// Every parameter at its default value.
    /// </summary>
    public static IReadOnlyDictionary<string, double> Defaults(IEnumerable<PredictionCalibrationParameter> parameters)
    {
        ArgumentNullException.ThrowIfNull(parameters);

        return parameters.ToDictionary(p => p.Key, p => p.DefaultValue);
    }

    /// <summary>
    /// Keeps only the given parameters' keys, fills any missing key with its default, and clamps each value
    /// to its parameter's range.
    /// </summary>
    public static IReadOnlyDictionary<string, double> Normalize(IReadOnlyDictionary<string, double> values, IEnumerable<PredictionCalibrationParameter> parameters)
    {
        ArgumentNullException.ThrowIfNull(values);
        ArgumentNullException.ThrowIfNull(parameters);

        return parameters.ToDictionary(
            p => p.Key,
            p => Math.Clamp(values.TryGetValue(p.Key, out var value) ? value : p.DefaultValue, p.Min, p.Max));
    }
}
