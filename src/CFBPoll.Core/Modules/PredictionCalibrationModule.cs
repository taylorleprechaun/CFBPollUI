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

        stored.Values = PredictionCalibrationValues.Normalize(stored.Values, parameters);
        return stored;
    }

    public async Task<IEnumerable<PredictionCalibration>> GetSeasonAsync(int season)
    {
        return await _predictionCalibrationData.GetSeasonAsync(season).ConfigureAwait(false);
    }

    public async Task<PredictionCalibration> ResolveCarriedForwardAsync(int season, int week, IEnumerable<PredictionCalibrationParameter> parameters)
    {
        ArgumentNullException.ThrowIfNull(parameters);

        var parameterList = parameters.ToList();
        var previous = await _predictionCalibrationData.GetLatestBeforeAsync(season, week).ConfigureAwait(false);

        // A carried-forward row passes on its own origin (null when it carried the defaults), so a chain of
        // carried weeks points back to the week that actually set the values.
        var previousIsCarried = previous?.Source == PredictionCalibrationSource.CarriedForward;

        var values = PredictionCalibrationValues.Normalize(previous?.Values ?? new Dictionary<string, double>(), parameterList);
        if (previous is not null && previous.Season < season)
            values = ResetSeasonScopedValues(values, parameterList);

        return new PredictionCalibration
        {
            CarriedFromSeason = previousIsCarried ? previous!.CarriedFromSeason : previous?.Season,
            CarriedFromWeek = previousIsCarried ? previous!.CarriedFromWeek : previous?.Week,
            Season = season,
            Source = PredictionCalibrationSource.CarriedForward,
            Values = values,
            Week = week
        };
    }

    public async Task<PredictionCalibration> ResolveEffectiveAsync(int season, int week, IEnumerable<PredictionCalibrationParameter> parameters)
    {
        ArgumentNullException.ThrowIfNull(parameters);

        var parameterList = parameters.ToList();

        return await GetAsync(season, week, parameterList).ConfigureAwait(false)
            ?? await ResolveCarriedForwardAsync(season, week, parameterList).ConfigureAwait(false);
    }

    public async Task<bool> SaveAsync(PredictionCalibration calibration)
    {
        ArgumentNullException.ThrowIfNull(calibration);

        return await _predictionCalibrationData.SaveAsync(calibration).ConfigureAwait(false);
    }

    public async Task<bool> SaveIfMissingAsync(PredictionCalibration calibration)
    {
        ArgumentNullException.ThrowIfNull(calibration);

        return await _predictionCalibrationData.SaveIfMissingAsync(calibration).ConfigureAwait(false);
    }

    /// <summary>
    /// Returns the values with every parameter that doesn't carry across seasons set back to its default.
    /// </summary>
    private IReadOnlyDictionary<string, double> ResetSeasonScopedValues(IReadOnlyDictionary<string, double> values, IEnumerable<PredictionCalibrationParameter> parameters)
    {
        var reset = new Dictionary<string, double>(values);
        foreach (var parameter in parameters.Where(p => !p.CarriesAcrossSeasons))
            reset[parameter.Key] = parameter.DefaultValue;

        return reset;
    }
}
