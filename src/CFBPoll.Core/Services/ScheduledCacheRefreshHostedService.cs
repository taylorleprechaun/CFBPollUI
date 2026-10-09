using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Services;

/// <summary>
/// Refreshes the cache entries public pages depend on at the scheduled refresh time, before they expire,
/// so visitors never wait on the College Football Data API. On startup it also warms any of those entries
/// that are missing (e.g. after a deploy or an admin cache clear).
/// </summary>
public class ScheduledCacheRefreshHostedService : BackgroundService
{
    private readonly IPersistentCache _cache;
    private readonly ICacheExpirationPolicy _expirationPolicy;
    private readonly ILogger<ScheduledCacheRefreshHostedService> _logger;
    private readonly CacheOptions _options;
    private readonly IPollLeadersModule _pollLeadersModule;
    private readonly ICFBDataCacheRefresher _refresher;
    private readonly ISeasonTrendsModule _seasonTrendsModule;
    private readonly ITeamPredictionRecordModule _teamPredictionRecordModule;
    private readonly TimeProvider _timeProvider;
    private readonly ITrackRecordModule _trackRecordModule;

    public ScheduledCacheRefreshHostedService(
        ICFBDataCacheRefresher refresher,
        IPersistentCache cache,
        ICacheExpirationPolicy expirationPolicy,
        IPollLeadersModule pollLeadersModule,
        ISeasonTrendsModule seasonTrendsModule,
        ITeamPredictionRecordModule teamPredictionRecordModule,
        ITrackRecordModule trackRecordModule,
        IOptions<CacheOptions> options,
        TimeProvider timeProvider,
        ILogger<ScheduledCacheRefreshHostedService> logger)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _expirationPolicy = expirationPolicy ?? throw new ArgumentNullException(nameof(expirationPolicy));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _pollLeadersModule = pollLeadersModule ?? throw new ArgumentNullException(nameof(pollLeadersModule));
        _refresher = refresher ?? throw new ArgumentNullException(nameof(refresher));
        _seasonTrendsModule = seasonTrendsModule ?? throw new ArgumentNullException(nameof(seasonTrendsModule));
        _teamPredictionRecordModule = teamPredictionRecordModule ?? throw new ArgumentNullException(nameof(teamPredictionRecordModule));
        _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
        _trackRecordModule = trackRecordModule ?? throw new ArgumentNullException(nameof(trackRecordModule));
    }

    /// <summary>
    /// Refreshes every kept-warm entry in sequence (one at a time, so the refresh itself can't stampede the
    /// API): the current season year, the weekly items when requested, the live season's teams and schedule,
    /// then the derived result caches, which are rebuilt last so they see the freshly refreshed data.
    /// </summary>
    internal async Task<CacheRefreshRunResult> RefreshAsync(bool includeWeekly)
    {
        var result = new CacheRefreshRunResult();

        var season = await TryRefreshSeasonAsync(result).ConfigureAwait(false);
        if (season.HasValue)
        {
            await RunStepsAsync(BuildDataSteps(season.Value, includeWeekly), result).ConfigureAwait(false);
            await RunStepsAsync(BuildDerivedSteps(season.Value), result).ConfigureAwait(false);
        }

        LogResult("Scheduled cache refresh", result);
        return result;
    }

    /// <summary>
    /// Refreshes the current season year, then any kept-warm API entry (weekly items included) that is
    /// missing or already expired. Derived result caches are cheap to rebuild on demand, so they're left to
    /// the next request or scheduled refresh.
    /// </summary>
    internal async Task<CacheRefreshRunResult> WarmMissingAsync()
    {
        var result = new CacheRefreshRunResult();

        var season = await TryRefreshSeasonAsync(result).ConfigureAwait(false);
        if (season.HasValue)
        {
            var nowUTC = _timeProvider.GetUtcNow().UtcDateTime;
            var cachedKeys = (await _cache.GetAllEntriesMetadataAsync().ConfigureAwait(false))
                .Where(m => m.ExpiresAt > nowUTC)
                .Select(m => m.CacheKey)
                .ToHashSet();

            var missingSteps = BuildDataSteps(season.Value, includeWeekly: true).Where(s => !cachedKeys.Contains(s.Name));
            await RunStepsAsync(missingSteps, result).ConfigureAwait(false);
        }

        LogResult("Startup cache warm", result);
        return result;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.ScheduledRefreshEnabled)
        {
            _logger.LogInformation("Scheduled cache refresh is disabled");
            return;
        }

        await DelaySafelyAsync(TimeSpan.FromMinutes(_options.RefreshStartupDelayMinutes), stoppingToken).ConfigureAwait(false);
        if (stoppingToken.IsCancellationRequested)
            return;

        try
        {
            await WarmMissingAsync().ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Startup cache warm failed");
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            var nextRefreshUTC = _expirationPolicy.GetNextRefreshUTC(CacheRefreshTier.Daily);
            var includeWeekly = nextRefreshUTC == _expirationPolicy.GetNextRefreshUTC(CacheRefreshTier.Weekly);
            var delay = nextRefreshUTC - _timeProvider.GetUtcNow().UtcDateTime;

            _logger.LogInformation("Next scheduled cache refresh at {NextRefreshUTC} (weekly items included: {IncludeWeekly})", nextRefreshUTC, includeWeekly);
            await DelaySafelyAsync(delay > TimeSpan.Zero ? delay : TimeSpan.Zero, stoppingToken).ConfigureAwait(false);
            if (stoppingToken.IsCancellationRequested)
                break;

            try
            {
                await RefreshAsync(includeWeekly).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Scheduled cache refresh failed");
            }
        }
    }
    /// <summary>
    /// API-backed steps, named by the cache key they refresh. Teams and schedule are only kept warm while the
    /// season is live; a concluded season's entries never expire.
    /// </summary>
    private IEnumerable<RefreshStep> BuildDataSteps(int season, bool includeWeekly)
    {
        if (includeWeekly)
        {
            yield return new RefreshStep(CacheKeys.CONFERENCES, () => _refresher.RefreshConferencesAsync());
            yield return new RefreshStep(CacheKeys.Calendar(season), () => _refresher.RefreshCalendarAsync(season));
            yield return new RefreshStep(CacheKeys.Calendar(season + 1), () => _refresher.RefreshCalendarAsync(season + 1));
        }

        if (!SeasonLiveEvaluator.IsSeasonLive(season, _timeProvider.GetUtcNow().UtcDateTime, _options))
            yield break;

        yield return new RefreshStep(CacheKeys.Teams(season), () => _refresher.RefreshFBSTeamsAsync(season));
        yield return new RefreshStep(CacheKeys.FullSchedule(season), () => _refresher.RefreshFullSeasonScheduleAsync(season));
    }

    private IEnumerable<RefreshStep> BuildDerivedSteps(int season)
    {
        yield return new RefreshStep("track record", async () =>
        {
            await _trackRecordModule.InvalidateCacheAsync().ConfigureAwait(false);
            await _trackRecordModule.GetTrackRecordAsync().ConfigureAwait(false);
            return true;
        });

        yield return new RefreshStep("team prediction records", async () =>
        {
            await _teamPredictionRecordModule.InvalidateCacheAsync().ConfigureAwait(false);
            await _teamPredictionRecordModule.GetTeamRecordsAsync(season).ConfigureAwait(false);
            return true;
        });

        yield return new RefreshStep("season trends", async () =>
        {
            await _seasonTrendsModule.InvalidateCacheAsync().ConfigureAwait(false);
            await _seasonTrendsModule.GetSeasonTrendsAsync(season).ConfigureAwait(false);
            return true;
        });

        yield return new RefreshStep("poll leaders", async () =>
        {
            await _pollLeadersModule.InvalidateCacheAsync().ConfigureAwait(false);
            await _pollLeadersModule.GetPollLeadersAsync(null, null).ConfigureAwait(false);
            return true;
        });
    }

    private async Task DelaySafelyAsync(TimeSpan delay, CancellationToken token)
    {
        try
        {
            await Task.Delay(delay, _timeProvider, token).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            // Expected during shutdown.
        }
    }

    private void LogResult(string runName, CacheRefreshRunResult result)
    {
        _logger.LogInformation(
            "{RunName} finished: {Refreshed} refreshed, {KeptExisting} kept existing, {Failed} failed",
            runName, result.Refreshed, result.KeptExisting, result.Failed);
    }

    private async Task RunStepsAsync(IEnumerable<RefreshStep> steps, CacheRefreshRunResult result)
    {
        foreach (var step in steps)
        {
            try
            {
                if (await step.Run().ConfigureAwait(false))
                    result.Refreshed++;
                else
                    result.KeptExisting++;
            }
            catch (Exception ex)
            {
                result.Failed++;
                _logger.LogWarning(ex, "Cache refresh failed for {RefreshItem}", step.Name);
            }
        }
    }

    /// <summary>
    /// Refreshes the current season year, which every season-scoped step depends on. Returns null (and
    /// counts a failure) if it can't be determined, in which case the season-scoped steps are skipped.
    /// </summary>
    private async Task<int?> TryRefreshSeasonAsync(CacheRefreshRunResult result)
    {
        try
        {
            var season = await _refresher.RefreshMaxSeasonYearAsync().ConfigureAwait(false);
            result.Refreshed++;
            return season;
        }
        catch (Exception ex)
        {
            result.Failed++;
            _logger.LogWarning(ex, "Cache refresh could not determine the current season; skipping season-scoped items");
            return null;
        }
    }

    private sealed record RefreshStep(string Name, Func<Task<bool>> Run);
}
