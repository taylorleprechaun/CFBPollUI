using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Modules;

public class TrackRecordModule : ITrackRecordModule
{
    public const string CACHE_KEY_PREFIX = "track-record_";

    private const string CACHE_KEY = CACHE_KEY_PREFIX + "all";

    private readonly IPersistentCache _cache;
    private readonly CacheOptions _cacheOptions;
    private readonly ILogger<TrackRecordModule> _logger;
    private readonly IPredictionsModule _predictionsModule;

    public TrackRecordModule(
        IPersistentCache cache,
        IOptions<CacheOptions> cacheOptions,
        ILogger<TrackRecordModule> logger,
        IPredictionsModule predictionsModule)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _cacheOptions = cacheOptions?.Value ?? throw new ArgumentNullException(nameof(cacheOptions));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _predictionsModule = predictionsModule ?? throw new ArgumentNullException(nameof(predictionsModule));
    }

    public async Task<TrackRecordResult> GetTrackRecordAsync()
    {
        var cached = await _cache.GetAsync<TrackRecordResult>(CACHE_KEY).ConfigureAwait(false);
        if (cached is not null)
        {
            _logger.LogDebug("Cache hit for track record");
            return cached;
        }

        _logger.LogInformation("Computing track record");

        var summaries = (await _predictionsModule.GetAllSummariesAsync().ConfigureAwait(false))
            .Where(s => s.IsPublished && s.IsGraded && s.ResultsPublished)
            .OrderBy(s => s.Season)
            .ThenBy(s => s.Week)
            .ToList();

        var weeks = new List<TrackRecordWeek>();
        var overallOverUnder = new TrackRecordTotals();
        var overallSpread = new TrackRecordTotals();
        var overallWinner = new TrackRecordTotals();

        foreach (var summary in summaries)
        {
            var predictions = await _predictionsModule.GetAsync(summary.Season, summary.Week).ConfigureAwait(false);
            if (predictions is null)
            {
                _logger.LogWarning(
                    "Graded summary found for season {Season}, week {Week} but predictions could not be loaded",
                    summary.Season, summary.Week);
                continue;
            }

            var weekOverUnder = new TrackRecordTotals();
            var weekSpread = new TrackRecordTotals();
            var weekWinner = new TrackRecordTotals();

            foreach (var game in predictions.Predictions)
            {
                Tally(weekOverUnder, overallOverUnder, game.OverUnderGrade);
                Tally(weekSpread, overallSpread, game.SpreadGrade);
                Tally(weekWinner, overallWinner, game.WinnerGrade);
            }

            weeks.Add(new TrackRecordWeek
            {
                OverUnder = weekOverUnder,
                Season = summary.Season,
                Spread = weekSpread,
                Week = summary.Week,
                Winner = weekWinner
            });
        }

        var result = new TrackRecordResult
        {
            OverallOverUnder = overallOverUnder,
            OverallSpread = overallSpread,
            OverallWinner = overallWinner,
            Weeks = weeks
        };

        var expiresAt = DateTime.UtcNow.AddHours(_cacheOptions.TrackRecordExpirationHours);
        await _cache.SetAsync(CACHE_KEY, result, expiresAt).ConfigureAwait(false);

        return result;
    }

    public async Task InvalidateCacheAsync()
    {
        var count = await _cache.RemoveByPrefixAsync(CACHE_KEY_PREFIX).ConfigureAwait(false);
        _logger.LogDebug("Invalidated {Count} track record cache entries", count);
    }

    private static void Tally(TrackRecordTotals week, TrackRecordTotals overall, PredictionGradeStatus grade)
    {
        switch (grade)
        {
            case PredictionGradeStatus.Correct:
                week.Correct++;
                overall.Correct++;
                break;
            case PredictionGradeStatus.Incorrect:
                week.Incorrect++;
                overall.Incorrect++;
                break;
            case PredictionGradeStatus.Push:
                week.Push++;
                overall.Push++;
                break;
        }
    }
}
