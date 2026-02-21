using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Modules;

public class AdminModule : IAdminModule
{
    private readonly IPersistentCache _cache;
    private readonly ICFBDataService _dataService;
    private readonly IExcelExportModule _excelExportModule;
    private readonly ILogger<AdminModule> _logger;
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingModule _ratingModule;

    public AdminModule(
        ICFBDataService dataService,
        IExcelExportModule excelExportModule,
        IPersistentCache cache,
        IRankingsModule rankingsModule,
        IRatingModule ratingModule,
        ILogger<AdminModule> logger)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _excelExportModule = excelExportModule ?? throw new ArgumentNullException(nameof(excelExportModule));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _ratingModule = ratingModule ?? throw new ArgumentNullException(nameof(ratingModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<CalculateRankingsResult> CalculateRankingsAsync(int season, int week)
    {
        _logger.LogInformation("Calculating rankings for season {Season}, week {Week}", season, week);

        await ClearSeasonCacheAsync(season, week).ConfigureAwait(false);
        _logger.LogDebug("Cleared component caches for season {Season} to force fresh API data", season);

        var seasonData = await _dataService.GetSeasonDataAsync(season, week).ConfigureAwait(false);
        var ratings = await _ratingModule.RateTeamsAsync(seasonData).ConfigureAwait(false);
        var rankings = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings).ConfigureAwait(false);

        var persisted = true;
        try
        {
            await _rankingsModule.SaveSnapshotAsync(rankings).ConfigureAwait(false);
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
        return await _rankingsModule.DeleteSnapshotAsync(season, week).ConfigureAwait(false);
    }

    public async Task<byte[]?> ExportRankingsAsync(int season, int week)
    {
        _logger.LogInformation("Exporting rankings for season {Season}, week {Week}", season, week);

        var snapshot = await _rankingsModule.GetSnapshotAsync(season, week).ConfigureAwait(false);

        if (snapshot is null)
            return null;

        return _excelExportModule.GenerateRankingsWorkbook(snapshot);
    }

    public async Task<IEnumerable<PersistedWeekSummary>> GetPersistedWeeksAsync()
    {
        return await _rankingsModule.GetPersistedWeeksAsync().ConfigureAwait(false);
    }

    public async Task<bool> PublishSnapshotAsync(int season, int week)
    {
        _logger.LogInformation("Publishing snapshot for season {Season}, week {Week}", season, week);
        return await _rankingsModule.PublishSnapshotAsync(season, week).ConfigureAwait(false);
    }

    private async Task ClearSeasonCacheAsync(int season, int week)
    {
        var cacheKeys = new[]
        {
            $"teams_{season}",
            $"games_{season}_regular",
            $"games_{season}_postseason",
            $"advancedGameStats_{season}_regular",
            $"advancedGameStats_{season}_postseason",
            $"seasonStats_{season}",
            $"seasonStats_{season}_week_{week}"
        };

        foreach (var key in cacheKeys)
        {
            await _cache.RemoveAsync(key).ConfigureAwait(false);
        }
    }
}
