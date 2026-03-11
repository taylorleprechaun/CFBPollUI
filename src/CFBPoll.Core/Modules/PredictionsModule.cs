using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

public class PredictionsModule : IPredictionsModule
{
    private readonly IPredictionsData _predictionsData;

    public PredictionsModule(IPredictionsData predictionsData)
    {
        _predictionsData = predictionsData ?? throw new ArgumentNullException(nameof(predictionsData));
    }

    public async Task<bool> DeleteAsync(int season, int week)
    {
        return await _predictionsData.DeleteAsync(season, week).ConfigureAwait(false);
    }

    public async Task<PredictionsResult?> GetAsync(int season, int week)
    {
        return await _predictionsData.GetAsync(season, week).ConfigureAwait(false);
    }

    public async Task<IEnumerable<PredictionsSummary>> GetAllSummariesAsync()
    {
        return await _predictionsData.GetAllSummariesAsync().ConfigureAwait(false);
    }

    public async Task<bool> PublishAsync(int season, int week)
    {
        return await _predictionsData.PublishAsync(season, week).ConfigureAwait(false);
    }

    public async Task<bool> SaveAsync(PredictionsResult predictions)
    {
        ArgumentNullException.ThrowIfNull(predictions);

        return await _predictionsData.SaveAsync(predictions).ConfigureAwait(false);
    }
}
