using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Modules;

public class CachingRankingsModule : IRankingsModule
{
    private readonly IPersistentCache _cache;
    private readonly IRankingsModule _innerModule;
    private readonly ILogger<CachingRankingsModule> _logger;
    private readonly CacheOptions _options;

    public CachingRankingsModule(
        IRankingsModule innerModule,
        IPersistentCache cache,
        IOptions<CacheOptions> options,
        ILogger<CachingRankingsModule> logger)
    {
        _innerModule = innerModule ?? throw new ArgumentNullException(nameof(innerModule));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    public async Task<RankingsResult> GenerateRankingsAsync(
        SeasonData seasonData,
        IDictionary<string, RatingDetails> ratings)
    {
        var cacheKey = $"rankings_{seasonData.Season}_week_{seasonData.Week}";

        var cached = await _cache.GetAsync<RankingsResult>(cacheKey);
        if (cached != null)
        {
            _logger.LogDebug("Cache hit for rankings {Season} week {Week}", seasonData.Season, seasonData.Week);
            return cached;
        }

        _logger.LogDebug(
            "Cache miss for rankings {Season} week {Week}, generating",
            seasonData.Season,
            seasonData.Week);

        var result = await _innerModule.GenerateRankingsAsync(seasonData, ratings);

        var expiresAt = CalculateRankingsExpiration(seasonData.Season);
        await _cache.SetAsync(cacheKey, result, expiresAt);

        return result;
    }

    private DateTime CalculateRankingsExpiration(int season)
    {
        var currentYear = DateTime.Now.Year;

        if (season < currentYear)
        {
            return DateTime.MaxValue;
        }

        return DateTime.UtcNow.AddHours(_options.RankingsExpirationHours);
    }
}
