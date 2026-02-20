using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Services;

public class CachingCFBDataService : ICFBDataService
{
    private readonly IPersistentCache _cache;
    private readonly ICFBDataService _innerService;
    private readonly ILogger<CachingCFBDataService> _logger;
    private readonly CacheOptions _options;

    public CachingCFBDataService(
        ICFBDataService innerService,
        IPersistentCache cache,
        IOptions<CacheOptions> options,
        ILogger<CachingCFBDataService> logger)
    {
        _innerService = innerService ?? throw new ArgumentNullException(nameof(innerService));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    public async Task<IEnumerable<AdvancedGameStats>> GetAdvancedGameStatsAsync(int season, string seasonType)
    {
        var expiresAt = CalculateExpiration(season, _options.SeasonDataExpirationHours);
        return await GetOrCacheListAsync(
            $"advancedGameStats_{season}_{seasonType}",
            () => _innerService.GetAdvancedGameStatsAsync(season, seasonType),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<IEnumerable<CalendarWeek>> GetCalendarAsync(int year)
    {
        var expiresAt = CalculateExpiration(year, _options.CalendarExpirationHours);
        return await GetOrCacheListAsync(
            $"calendar_{year}",
            () => _innerService.GetCalendarAsync(year),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<IEnumerable<Conference>> GetConferencesAsync()
    {
        var expiresAt = DateTime.UtcNow.AddHours(_options.ConferenceExpirationHours);
        return await GetOrCacheListAsync(
            "conferences",
            () => _innerService.GetConferencesAsync(),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<IEnumerable<FBSTeam>> GetFBSTeamsAsync(int season)
    {
        var expiresAt = CalculateExpiration(season, _options.SeasonDataExpirationHours);
        return await GetOrCacheListAsync(
            $"teams_{season}",
            () => _innerService.GetFBSTeamsAsync(season),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<IEnumerable<ScheduleGame>> GetFullSeasonScheduleAsync(int season)
    {
        var expiresAt = CalculateExpiration(season, _options.SeasonDataExpirationHours);
        return await GetOrCacheListAsync(
            $"fullSchedule_{season}",
            () => _innerService.GetFullSeasonScheduleAsync(season),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<IEnumerable<Game>> GetGamesAsync(int season, string seasonType)
    {
        var expiresAt = CalculateExpiration(season, _options.SeasonDataExpirationHours);
        return await GetOrCacheListAsync(
            $"games_{season}_{seasonType}",
            () => _innerService.GetGamesAsync(season, seasonType),
            expiresAt).ConfigureAwait(false);
    }

    public async Task<int> GetMaxSeasonYearAsync()
    {
        const string cacheKey = "maxSeasonYear";

        var cached = await _cache.GetAsync<MaxSeasonYearWrapper>(cacheKey).ConfigureAwait(false);
        if (cached is not null)
        {
            _logger.LogDebug("Cache hit for {CacheKey}", cacheKey);
            return cached.Year;
        }

        _logger.LogDebug("Cache miss for {CacheKey}, fetching from API", cacheKey);
        var year = await _innerService.GetMaxSeasonYearAsync().ConfigureAwait(false);

        var expiresAt = DateTime.UtcNow.AddHours(_options.MaxSeasonYearExpirationHours);
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

        await Task.WhenAll(teamsTask, regularGamesTask, postseasonGamesTask, regularAdvancedStatsTask).ConfigureAwait(false);

        var teams = await teamsTask.ConfigureAwait(false);
        var regularGames = await regularGamesTask.ConfigureAwait(false);
        var postseasonGames = await postseasonGamesTask.ConfigureAwait(false);
        var regularAdvancedStats = await regularAdvancedStatsTask.ConfigureAwait(false);

        var maxRegularWeek = regularGames
            .Where(g => g.Week.HasValue)
            .Select(g => g.Week!.Value)
            .DefaultIfEmpty(0)
            .Max();

        var includePostseason = week > maxRegularWeek;
        var postseasonAdvancedStats = includePostseason
            ? await GetAdvancedGameStatsAsync(season, "postseason").ConfigureAwait(false)
            : Enumerable.Empty<AdvancedGameStats>();

        var hasPostseasonGames = includePostseason && postseasonGames.Any();
        int? endWeek = hasPostseasonGames ? null : week;
        var seasonStats = await GetSeasonTeamStatsAsync(season, endWeek).ConfigureAwait(false);

        return SeasonDataAssembler.Assemble(
            season, week, teams, regularGames, postseasonGames,
            regularAdvancedStats, postseasonAdvancedStats, seasonStats);
    }

    public async Task<IDictionary<string, IEnumerable<TeamStat>>> GetSeasonTeamStatsAsync(int season, int? endWeek)
    {
        var cacheKey = endWeek.HasValue
            ? $"seasonStats_{season}_week_{endWeek.Value}"
            : $"seasonStats_{season}";

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

        var expiresAt = CalculateExpiration(season, _options.SeasonDataExpirationHours);
        await _cache.SetAsync(cacheKey, serializableData, expiresAt).ConfigureAwait(false);

        return data;
    }

    private DateTime CalculateExpiration(int year, int expirationHours)
    {
        var currentYear = DateTime.UtcNow.Year;

        if (year < currentYear)
        {
            return DateTime.MaxValue;
        }

        return DateTime.UtcNow.AddHours(expirationHours);
    }

    private async Task<List<T>> GetOrCacheListAsync<T>(
        string cacheKey,
        Func<Task<IEnumerable<T>>> fetchFunc,
        DateTime expiresAt) where T : class
    {
        var cached = await _cache.GetAsync<List<T>>(cacheKey).ConfigureAwait(false);
        if (cached is not null)
        {
            _logger.LogDebug("Cache hit for {CacheKey}", cacheKey);
            return cached;
        }

        _logger.LogDebug("Cache miss for {CacheKey}, fetching from API", cacheKey);
        var data = (await fetchFunc().ConfigureAwait(false)).ToList();
        await _cache.SetAsync(cacheKey, data, expiresAt).ConfigureAwait(false);

        return data;
    }

    internal class MaxSeasonYearWrapper
    {
        public int Year { get; set; }
    }
}
