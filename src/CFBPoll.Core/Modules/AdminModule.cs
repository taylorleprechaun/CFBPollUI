using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Modules;

public class AdminModule : IAdminModule
{
    private readonly IPersistentCache _cache;
    private readonly ICFBDataService _dataService;
    private readonly ILogger<AdminModule> _logger;
    private readonly IRankingsData _rankingsData;
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingModule _ratingModule;

    public AdminModule(
        ICFBDataService dataService,
        IPersistentCache cache,
        IRankingsData rankingsData,
        IRankingsModule rankingsModule,
        IRatingModule ratingModule,
        ILogger<AdminModule> logger)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _rankingsData = rankingsData ?? throw new ArgumentNullException(nameof(rankingsData));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _ratingModule = ratingModule ?? throw new ArgumentNullException(nameof(ratingModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<CalculateRankingsResult> CalculateRankingsAsync(int season, int week)
    {
        _logger.LogInformation("Calculating rankings for season {Season}, week {Week}", season, week);

        var cacheKey = $"seasonData_{season}_week_{week}";
        await _cache.RemoveAsync(cacheKey).ConfigureAwait(false);
        _logger.LogDebug("Cleared cache for {CacheKey} to force fresh API data", cacheKey);

        var seasonData = await _dataService.GetSeasonDataAsync(season, week).ConfigureAwait(false);
        var ratings = _ratingModule.RateTeams(seasonData);
        var rankings = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings).ConfigureAwait(false);

        var persisted = true;
        try
        {
            await _rankingsData.SaveSnapshotAsync(rankings).ConfigureAwait(false);
            _logger.LogInformation("Saved draft snapshot for season {Season}, week {Week}", season, week);
        }
        catch (Exception ex)
        {
            persisted = false;
            _logger.LogWarning(ex, "Failed to persist snapshot for season {Season}, week {Week}", season, week);
        }

        return new CalculateRankingsResult
        {
            Persisted = persisted,
            Rankings = rankings
        };
    }

    public async Task<bool> DeleteSnapshotAsync(int season, int week)
    {
        _logger.LogInformation("Deleting snapshot for season {Season}, week {Week}", season, week);
        return await _rankingsData.DeleteSnapshotAsync(season, week).ConfigureAwait(false);
    }

    public async Task<IEnumerable<PersistedWeekSummary>> GetPersistedWeeksAsync()
    {
        return await _rankingsData.GetPersistedWeeksAsync().ConfigureAwait(false);
    }

    public async Task<bool> PublishSnapshotAsync(int season, int week)
    {
        _logger.LogInformation("Publishing snapshot for season {Season}, week {Week}", season, week);
        return await _rankingsData.PublishSnapshotAsync(season, week).ConfigureAwait(false);
    }
}
