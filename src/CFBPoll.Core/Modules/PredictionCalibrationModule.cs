using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

public class PredictionCalibrationModule : IPredictionCalibrationModule
{
    private readonly IPredictionCalibrationData _predictionCalibrationData;

    public PredictionCalibrationModule(IPredictionCalibrationData predictionCalibrationData)
    {
        _predictionCalibrationData = predictionCalibrationData ?? throw new ArgumentNullException(nameof(predictionCalibrationData));
    }

    public async Task<PredictionCalibration?> GetAsync(int season, int week, IEnumerable<PredictionCalibrationParameter> parameters)
    {
        ArgumentNullException.ThrowIfNull(parameters);

        var stored = await _predictionCalibrationData.GetAsync(season, week).ConfigureAwait(false);
        if (stored is null)
            return null;

        stored.Values = Normalize(stored.Values, parameters);
        return stored;
    }

    public async Task<IEnumerable<PredictionCalibration>> GetSeasonAsync(int season)
    {
        return await _predictionCalibrationData.GetSeasonAsync(season).ConfigureAwait(false);
    }

    public async Task<PredictionCalibration> ResolveEffectiveAsync(int season, int week, IEnumerable<PredictionCalibrationParameter> parameters)
    {
        ArgumentNullException.ThrowIfNull(parameters);

        var parameterList = parameters.ToList();

        var stored = await GetAsync(season, week, parameterList).ConfigureAwait(false);
        if (stored is not null)
            return stored;

        var previous = await _predictionCalibrationData.GetLatestBeforeAsync(season, week).ConfigureAwait(false);

        return new PredictionCalibration
        {
            Season = season,
            Source = PredictionCalibrationSource.CarriedForward,
            Values = Normalize(previous?.Values ?? new Dictionary<string, double>(), parameterList),
            Week = week
        };
    }

    public async Task<bool> SaveAsync(PredictionCalibration calibration)
    {
        ArgumentNullException.ThrowIfNull(calibration);

        return await _predictionCalibrationData.SaveAsync(calibration).ConfigureAwait(false);
    }

    /// <summary>
    /// Keeps only the given parameters' keys, fills any missing key with its default, and clamps each
    /// value to its parameter's range.
    /// </summary>
    private IReadOnlyDictionary<string, double> Normalize(IReadOnlyDictionary<string, double> values, IEnumerable<PredictionCalibrationParameter> parameters)
    {
        return parameters.ToDictionary(
            p => p.Key,
            p => Math.Clamp(values.TryGetValue(p.Key, out var value) ? value : p.DefaultValue, p.Min, p.Max));
    }
}
