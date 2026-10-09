using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Services;

public class CachingCFBDataService : ICFBDataService, ICFBDataCacheRefresher
{
    private readonly IPersistentCache _cache;
    private readonly ICacheExpirationPolicy _expirationPolicy;
    private readonly ICFBDataService _innerService;
    private readonly ILogger<CachingCFBDataService> _logger;

    public CachingCFBDataService(
        ICFBDataService innerService,
        IPersistentCache cache,
        ICacheExpirationPolicy expirationPolicy,
        ILogger<CachingCFBDataService> logger)
    {
        _innerService = innerService ?? throw new ArgumentNullException(nameof(innerService));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _expirationPolicy = expirationPolicy ?? throw new ArgumentNullException(nameof(expirationPolicy));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IEnumerable<AdvancedGameStats>> GetAdvancedGameStatsAsync(int season, string seasonType)
    {
        var expiresAt = _expirationPolicy.GetSeasonExpiration(season, CacheRefreshTier.Daily);
        return await GetOrCacheListAsync(
            CacheKeys.AdvancedGameStats(season, seasonType),
            () => _innerService.GetAdvancedGameStatsAsync(season, seasonType),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<IEnumerable<BettingLine>> GetBettingLinesAsync(int season, int week)
    {
        var expiresAt = _expirationPolicy.GetSeasonExpiration(season, CacheRefreshTier.Daily);
        return await GetOrCacheListAsync(
            CacheKeys.BettingLines(season, week),
            () => _innerService.GetBettingLinesAsync(season, week),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<IEnumerable<CalendarWeek>> GetCalendarAsync(int year)
    {
        var expiresAt = _expirationPolicy.GetSeasonExpiration(year, CacheRefreshTier.Weekly);
        return await GetOrCacheListAsync(
            CacheKeys.Calendar(year),
            () => _innerService.GetCalendarAsync(year),
            expiresAt,
            emptyResultIsGenuine: true).ConfigureAwait(false);
    }

    public async Task<CFBDUsage> GetCFBDUsageAsync(bool forceRefresh = false)
    {
        const string cacheKey = CacheKeys.CFBD_USAGE;

        if (!forceRefresh)
        {
            var cached = await _cache.GetAsync<CFBDUsage>(cacheKey).ConfigureAwait(false);
            if (cached is not null)
            {
                _logger.LogDebug("Cache hit for {CacheKey}", cacheKey);
                return cached;
            }
        }

        _logger.LogDebug("Cache miss for {CacheKey}, fetching from API", cacheKey);
        var usage = await _innerService.GetCFBDUsageAsync(forceRefresh).ConfigureAwait(false);

        var expiresAt = _expirationPolicy.GetExpiration(CacheRefreshTier.Daily);
        await _cache.SetAsync(cacheKey, usage, expiresAt).ConfigureAwait(false);

        return usage;
    }

    public async Task<IEnumerable<Conference>> GetConferencesAsync()
    {
        var expiresAt = _expirationPolicy.GetExpiration(CacheRefreshTier.Weekly);
        return await GetOrCacheListAsync(
            CacheKeys.CONFERENCES,
            () => _innerService.GetConferencesAsync(),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<IEnumerable<FBSTeam>> GetFBSTeamsAsync(int season)
    {
        var expiresAt = _expirationPolicy.GetSeasonExpiration(season, CacheRefreshTier.Daily);
        return await GetOrCacheListAsync(
            CacheKeys.Teams(season),
            () => _innerService.GetFBSTeamsAsync(season),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<IEnumerable<ScheduleGame>> GetFullSeasonScheduleAsync(int season)
    {
        var expiresAt = _expirationPolicy.GetSeasonExpiration(season, CacheRefreshTier.Daily);
        return await GetOrCacheListAsync(
            CacheKeys.FullSchedule(season),
            () => _innerService.GetFullSeasonScheduleAsync(season),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<IEnumerable<Game>> GetGamesAsync(int season, string seasonType)
    {
        var expiresAt = _expirationPolicy.GetSeasonExpiration(season, CacheRefreshTier.Daily);
        return await GetOrCacheListAsync(
            CacheKeys.Games(season, seasonType),
            () => _innerService.GetGamesAsync(season, seasonType),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<IEnumerable<GameTeamStats>> GetGameTeamStatsAsync(int season, string seasonType)
    {
        var expiresAt = _expirationPolicy.GetSeasonExpiration(season, CacheRefreshTier.Daily);
        return await GetOrCacheListAsync(
            CacheKeys.GameTeamStats(season, seasonType),
            () => _innerService.GetGameTeamStatsAsync(season, seasonType),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<int> GetMaxSeasonYearAsync()
    {
        const string cacheKey = CacheKeys.MAX_SEASON_YEAR;

        var cached = await _cache.GetAsync<MaxSeasonYearWrapper>(cacheKey).ConfigureAwait(false);
        if (cached is not null)
        {
            _logger.LogDebug("Cache hit for {CacheKey}", cacheKey);
            return cached.Year;
        }

        _logger.LogDebug("Cache miss for {CacheKey}, fetching from API", cacheKey);
        var year = await _innerService.GetMaxSeasonYearAsync().ConfigureAwait(false);

        var expiresAt = _expirationPolicy.GetExpiration(CacheRefreshTier.Daily);
        await _cache.SetAsync(cacheKey, new MaxSeasonYearWrapper { Year = year }, expiresAt).ConfigureAwait(false);

        return year;
    }

    public async Task<SeasonData> GetSeasonDataAsync(int season, int week)
    {
        _logger.LogDebug("Assembling season data for {Season} week {Week} from cached components", season, week);

        var teamsTask = GetFBSTeamsAsync(season);
        var regularGamesTask = GetGamesAsync(season, "regular");
        var postseasonGamesTask = GetGamesAsync(season, "postseason");
        var regularAdvancedStatsTask = GetAdvancedGameStatsAsync(season, "regular");
        var regularGameTeamStatsTask = GetGameTeamStatsAsync(season, "regular");

        await Task.WhenAll(teamsTask, regularGamesTask, postseasonGamesTask, regularAdvancedStatsTask, regularGameTeamStatsTask).ConfigureAwait(false);

        var teams = await teamsTask.ConfigureAwait(false);
        var regularGames = await regularGamesTask.ConfigureAwait(false);
        var postseasonGames = await postseasonGamesTask.ConfigureAwait(false);
        var regularAdvancedStats = await regularAdvancedStatsTask.ConfigureAwait(false);
        var regularGameTeamStats = await regularGameTeamStatsTask.ConfigureAwait(false);

        var maxRegularWeek = regularGames
            .Where(g => g.Week.HasValue)
            .Select(g => g.Week!.Value)
            .DefaultIfEmpty(0)
            .Max();

        var includePostseason = week > maxRegularWeek;
        var postseasonAdvancedStats = includePostseason
            ? await GetAdvancedGameStatsAsync(season, "postseason").ConfigureAwait(false)
            : Enumerable.Empty<AdvancedGameStats>();
        var postseasonGameTeamStats = includePostseason
            ? await GetGameTeamStatsAsync(season, "postseason").ConfigureAwait(false)
            : Enumerable.Empty<GameTeamStats>();

        var hasPostseasonGames = includePostseason && postseasonGames.Any();
        int? endWeek = hasPostseasonGames ? null : week;
        var seasonStats = await GetSeasonTeamStatsAsync(season, endWeek).ConfigureAwait(false);

        return SeasonDataAssembler.Assemble(
            season, week, teams, regularGames, postseasonGames,
            regularAdvancedStats, postseasonAdvancedStats,
            regularGameTeamStats, postseasonGameTeamStats, seasonStats);
    }

    public async Task<IDictionary<string, IEnumerable<TeamStat>>> GetSeasonTeamStatsAsync(int season, int? endWeek)
    {
        var cacheKey = CacheKeys.SeasonStats(season, endWeek);

        var cached = await _cache.GetAsync<Dictionary<string, List<TeamStat>>>(cacheKey).ConfigureAwait(false);
        if (cached is not null)
        {
            _logger.LogDebug("Cache hit for {CacheKey}", cacheKey);
            return cached.ToDictionary(
                kvp => kvp.Key,
                kvp => (IEnumerable<TeamStat>)kvp.Value);
        }

        _logger.LogDebug("Cache miss for {CacheKey}, fetching from API", cacheKey);
        var data = await _innerService.GetSeasonTeamStatsAsync(season, endWeek).ConfigureAwait(false);

        var serializableData = data.ToDictionary(
            kvp => kvp.Key,
            kvp => kvp.Value.ToList());

        var expiresAt = ExpirationFor(serializableData.Count, _expirationPolicy.GetSeasonExpiration(season, CacheRefreshTier.Daily), emptyResultIsGenuine: false);
        await _cache.SetAsync(cacheKey, serializableData, expiresAt).ConfigureAwait(false);

        return data;
    }

    public async Task<bool> RefreshCalendarAsync(int year)
    {
        return await RefreshListAsync(
            CacheKeys.Calendar(year),
            () => _innerService.GetCalendarAsync(year),
            _expirationPolicy.GetSeasonExpiration(year, CacheRefreshTier.Weekly),
            emptyResultIsGenuine: true).ConfigureAwait(false);
    }

    public async Task<bool> RefreshConferencesAsync()
    {
        return await RefreshListAsync(
            CacheKeys.CONFERENCES,
            () => _innerService.GetConferencesAsync(),
            _expirationPolicy.GetExpiration(CacheRefreshTier.Weekly)).ConfigureAwait(false);
    }

    public async Task<bool> RefreshFBSTeamsAsync(int season)
    {
        return await RefreshListAsync(
            CacheKeys.Teams(season),
            () => _innerService.GetFBSTeamsAsync(season),
            _expirationPolicy.GetSeasonExpiration(season, CacheRefreshTier.Daily)).ConfigureAwait(false);
    }

    public async Task<bool> RefreshFullSeasonScheduleAsync(int season)
    {
        return await RefreshListAsync(
            CacheKeys.FullSchedule(season),
            () => _innerService.GetFullSeasonScheduleAsync(season),
            _expirationPolicy.GetSeasonExpiration(season, CacheRefreshTier.Daily)).ConfigureAwait(false);
    }

    public async Task<int> RefreshMaxSeasonYearAsync()
    {
        var year = await _innerService.GetMaxSeasonYearAsync().ConfigureAwait(false);

        var expiresAt = _expirationPolicy.GetExpiration(CacheRefreshTier.Daily);
        await _cache.SetAsync(CacheKeys.MAX_SEASON_YEAR, new MaxSeasonYearWrapper { Year = year }, expiresAt).ConfigureAwait(false);

        return year;
    }

    /// <summary>
    /// Returns the expiration for a fetched result. Most fetchers swallow upstream errors and return an empty
    /// list, so an empty result is kept only briefly instead of until the next scheduled refresh. Callers whose
    /// fetcher throws on errors instead (the calendar) pass <paramref name="emptyResultIsGenuine"/> so a
    /// genuinely empty result, such as a future season's calendar, keeps the normal scheduled expiration.
    /// </summary>
    private DateTime ExpirationFor(int itemCount, DateTime scheduledExpiration, bool emptyResultIsGenuine)
    {
        return itemCount == 0 && !emptyResultIsGenuine ? _expirationPolicy.GetEmptyResultExpiration() : scheduledExpiration;
    }

    private async Task<List<T>> GetOrCacheListAsync<T>(
        string cacheKey,
        Func<Task<IEnumerable<T>>> fetchFunc,
        DateTime expiresAt,
        bool emptyResultIsGenuine = false) where T : class
    {
        var cached = await _cache.GetAsync<List<T>>(cacheKey).ConfigureAwait(false);
        if (cached is not null)
        {
            _logger.LogDebug("Cache hit for {CacheKey}", cacheKey);
            return cached;
        }

        _logger.LogDebug("Cache miss for {CacheKey}, fetching from API", cacheKey);
        var data = (await fetchFunc().ConfigureAwait(false)).ToList();
        await _cache.SetAsync(cacheKey, data, ExpirationFor(data.Count, expiresAt, emptyResultIsGenuine)).ConfigureAwait(false);

        return data;
    }

    /// <summary>
    /// Fetches fresh data and replaces the cached copy in place, so readers never see a gap. An empty fetch
    /// never replaces existing data, since it may be a swallowed upstream error rather than real emptiness.
    /// </summary>
    private async Task<bool> RefreshListAsync<T>(string cacheKey, Func<Task<IEnumerable<T>>> fetchFunc, DateTime expiresAt, bool emptyResultIsGenuine = false) where T : class
    {
        var data = (await fetchFunc().ConfigureAwait(false)).ToList();

        if (data.Count == 0)
        {
            var existing = await _cache.GetAsync<List<T>>(cacheKey).ConfigureAwait(false);
            if (existing is { Count: > 0 })
            {
                _logger.LogWarning("Refresh of {CacheKey} returned no data; keeping the existing cached copy", cacheKey);
                return false;
            }
        }

        await _cache.SetAsync(cacheKey, data, ExpirationFor(data.Count, expiresAt, emptyResultIsGenuine)).ConfigureAwait(false);
        _logger.LogDebug("Refreshed {CacheKey} with {Count} items", cacheKey, data.Count);

        return true;
    }

    internal class MaxSeasonYearWrapper
    {
        public int Year { get; set; }
    }
}
