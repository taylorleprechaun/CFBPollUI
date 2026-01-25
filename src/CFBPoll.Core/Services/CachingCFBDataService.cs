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

    public async Task<IEnumerable<CalendarWeek>> GetCalendarAsync(int year)
    {
        var cacheKey = $"calendar_{year}";

        var cached = await _cache.GetAsync<List<CalendarWeek>>(cacheKey);
        if (cached != null)
        {
            _logger.LogDebug("Cache hit for calendar {Year}", year);
            return cached;
        }

        _logger.LogDebug("Cache miss for calendar {Year}, fetching from API", year);
        var data = await _innerService.GetCalendarAsync(year);
        var dataList = data.ToList();

        var expiresAt = CalculateCalendarExpiration(year);
        await _cache.SetAsync(cacheKey, dataList, expiresAt);

        return dataList;
    }

    public async Task<int> GetMaxSeasonYearAsync()
    {
        const string cacheKey = "maxSeasonYear";

        var cached = await _cache.GetAsync<MaxSeasonYearWrapper>(cacheKey);
        if (cached != null)
        {
            _logger.LogDebug("Cache hit for max season year");
            return cached.Year;
        }

        _logger.LogDebug("Cache miss for max season year, fetching from API");
        var year = await _innerService.GetMaxSeasonYearAsync();

        var expiresAt = DateTime.UtcNow.AddHours(_options.MaxSeasonYearExpirationHours);
        await _cache.SetAsync(cacheKey, new MaxSeasonYearWrapper { Year = year }, expiresAt);

        return year;
    }

    public async Task<IEnumerable<AdvancedGameStats>> GetAdvancedGameStatsAsync(int season, string seasonType)
    {
        var cacheKey = $"advancedGameStats_{season}_{seasonType}";

        var cached = await _cache.GetAsync<List<AdvancedGameStats>>(cacheKey);
        if (cached != null)
        {
            _logger.LogDebug("Cache hit for advanced game stats {Season} {SeasonType}", season, seasonType);
            return cached;
        }

        _logger.LogDebug("Cache miss for advanced game stats {Season} {SeasonType}, fetching from API", season, seasonType);
        var data = await _innerService.GetAdvancedGameStatsAsync(season, seasonType);
        var dataList = data.ToList();

        var expiresAt = CalculateSeasonDataExpiration(season);
        await _cache.SetAsync(cacheKey, dataList, expiresAt);

        return dataList;
    }

    public async Task<IEnumerable<Conference>> GetConferencesAsync()
    {
        const string cacheKey = "conferences";

        var cached = await _cache.GetAsync<List<Conference>>(cacheKey);
        if (cached != null)
        {
            _logger.LogDebug("Cache hit for conferences");
            return cached;
        }

        _logger.LogDebug("Cache miss for conferences, fetching from API");
        var data = await _innerService.GetConferencesAsync();
        var dataList = data.ToList();

        var expiresAt = DateTime.UtcNow.AddDays(30);
        await _cache.SetAsync(cacheKey, dataList, expiresAt);

        return dataList;
    }

    public async Task<SeasonData> GetSeasonDataAsync(int season, int week)
    {
        var cacheKey = $"seasonData_{season}_week_{week}";

        var cached = await _cache.GetAsync<SeasonData>(cacheKey);
        if (cached != null)
        {
            _logger.LogDebug("Cache hit for season {Season} week {Week}", season, week);
            return cached;
        }

        _logger.LogDebug("Cache miss for season {Season} week {Week}, fetching from API", season, week);
        var data = await _innerService.GetSeasonDataAsync(season, week);

        var expiresAt = CalculateSeasonDataExpiration(season);
        await _cache.SetAsync(cacheKey, data, expiresAt);

        return data;
    }

    private DateTime CalculateCalendarExpiration(int year)
    {
        var currentYear = DateTime.Now.Year;

        if (year < currentYear)
        {
            return DateTime.UtcNow.AddDays(365);
        }

        return DateTime.UtcNow.AddHours(_options.CalendarExpirationHours);
    }

    private DateTime CalculateSeasonDataExpiration(int season)
    {
        var currentYear = DateTime.Now.Year;

        if (season < currentYear)
        {
            return DateTime.UtcNow.AddDays(365);
        }

        return DateTime.UtcNow.AddHours(_options.SeasonDataExpirationHours);
    }

    internal class MaxSeasonYearWrapper
    {
        public int Year { get; set; }
    }
}
