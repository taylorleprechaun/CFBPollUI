using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Modules;

public class TeamPredictionRecordModule : ITeamPredictionRecordModule
{
    public const string CACHE_KEY_PREFIX = "team-prediction-records_";

    private readonly IPersistentCache _cache;
    private readonly CacheOptions _cacheOptions;
    private readonly ILogger<TeamPredictionRecordModule> _logger;
    private readonly IPredictionsModule _predictionsModule;
    private readonly StringComparison _scoic = StringComparison.OrdinalIgnoreCase;

    public TeamPredictionRecordModule(
        IPersistentCache cache,
        IOptions<CacheOptions> cacheOptions,
        ILogger<TeamPredictionRecordModule> logger,
        IPredictionsModule predictionsModule)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _cacheOptions = cacheOptions?.Value ?? throw new ArgumentNullException(nameof(cacheOptions));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _predictionsModule = predictionsModule ?? throw new ArgumentNullException(nameof(predictionsModule));
    }

    public async Task<IReadOnlyList<TeamPredictionRecord>> GetTeamRecordsAsync(int season)
    {
        var cacheKey = $"{CACHE_KEY_PREFIX}{season}";
        var cached = await _cache.GetAsync<List<TeamPredictionRecord>>(cacheKey).ConfigureAwait(false);

        if (cached is not null)
        {
            _logger.LogDebug("Cache hit for team prediction records, season {Season}", season);
            return cached;
        }

        _logger.LogInformation("Computing team prediction records for season {Season}", season);

        var summaries = (await _predictionsModule.GetAllSummariesAsync().ConfigureAwait(false))
            .Where(s => s.Season == season && s.IsPublished && s.IsGraded && s.ResultsPublished)
            .OrderBy(s => s.Week)
            .ToList();

        var records = new Dictionary<string, TeamPredictionRecord>(StringComparer.OrdinalIgnoreCase);

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

            foreach (var game in predictions.Predictions)
            {
                Tally(records, game.HomeTeam, game.HomeLogoURL, game);
                Tally(records, game.AwayTeam, game.AwayLogoURL, game);
            }
        }

        var result = records.Values.OrderBy(r => r.TeamName).ToList();

        var expiresAt = DateTime.UtcNow.AddHours(_cacheOptions.TeamPredictionRecordsExpirationHours);
        await _cache.SetAsync(cacheKey, result, expiresAt).ConfigureAwait(false);

        return result;
    }

    public async Task InvalidateCacheAsync()
    {
        var count = await _cache.RemoveByPrefixAsync(CACHE_KEY_PREFIX).ConfigureAwait(false);
        _logger.LogDebug("Invalidated {Count} team prediction record cache entries", count);
    }

    private void Tally(IDictionary<string, TeamPredictionRecord> records, string teamName, string logoURL, GamePrediction game)
    {
        if (!records.TryGetValue(teamName, out var record))
        {
            record = new TeamPredictionRecord { TeamName = teamName };
            records[teamName] = record;
        }

        if (string.IsNullOrEmpty(record.LogoURL) && !string.IsNullOrEmpty(logoURL))
            record.LogoURL = logoURL;

        if (game.PredictedWinner.Equals(teamName, _scoic))
            record.PredictedWins++;
        else
            record.PredictedLosses++;

        if (game.WinnerGrade != PredictionGradeStatus.Correct && game.WinnerGrade != PredictionGradeStatus.Incorrect)
            return;

        record.GradedGameCount++;

        if (game.ActualWinner is not null && game.ActualWinner.Equals(teamName, _scoic))
            record.ActualWins++;
        else
            record.ActualLosses++;
    }
}
