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
    private readonly IPollLeadersModule _pollLeadersModule;
    private readonly IPredictionCalculatorModule _predictionCalculatorModule;
    private readonly IPredictionsModule _predictionsModule;
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingModule _ratingModule;
    private readonly ISeasonTrendsModule _seasonTrendsModule;

    public AdminModule(
        ICFBDataService dataService,
        IExcelExportModule excelExportModule,
        IPersistentCache cache,
        IPollLeadersModule pollLeadersModule,
        IPredictionCalculatorModule predictionCalculatorModule,
        IPredictionsModule predictionsModule,
        IRankingsModule rankingsModule,
        IRatingModule ratingModule,
        ISeasonTrendsModule seasonTrendsModule,
        ILogger<AdminModule> logger)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _excelExportModule = excelExportModule ?? throw new ArgumentNullException(nameof(excelExportModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _pollLeadersModule = pollLeadersModule ?? throw new ArgumentNullException(nameof(pollLeadersModule));
        _predictionCalculatorModule = predictionCalculatorModule ?? throw new ArgumentNullException(nameof(predictionCalculatorModule));
        _predictionsModule = predictionsModule ?? throw new ArgumentNullException(nameof(predictionsModule));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _ratingModule = ratingModule ?? throw new ArgumentNullException(nameof(ratingModule));
        _seasonTrendsModule = seasonTrendsModule ?? throw new ArgumentNullException(nameof(seasonTrendsModule));
    }

    public async Task<CalculatePredictionsResult> CalculatePredictionsAsync(int season, int week)
    {
        _logger.LogInformation("Calculating predictions for season {Season}, week {Week}", season, week);

        var seasonDataTask = _dataService.GetSeasonDataAsync(season, week);
        var fullScheduleTask = _dataService.GetFullSeasonScheduleAsync(season);
        await Task.WhenAll(seasonDataTask, fullScheduleTask).ConfigureAwait(false);

        var seasonData = seasonDataTask.Result;
        var fullSchedule = fullScheduleTask.Result;
        var gameWeek = week + 1;
        var fbsTeamNames = new HashSet<string>(seasonData.Teams.Keys, StringComparer.OrdinalIgnoreCase);
        var scoic = StringComparison.OrdinalIgnoreCase;

        var maxRegularWeek = fullSchedule
            .Where(g => g.SeasonType is not null && g.SeasonType.Equals("regular", scoic) && g.Week.HasValue)
            .Select(g => g.Week!.Value)
            .DefaultIfEmpty(0)
            .Max();

        var isPostseason = gameWeek > maxRegularWeek;

        // CFBD API serves all postseason betting lines under week 1
        var bettingLinesWeek = isPostseason ? 1 : gameWeek;

        var ratingsTask = _ratingModule.RateTeamsAsync(seasonData);
        var bettingLinesTask = _dataService.GetBettingLinesAsync(season, bettingLinesWeek);
        await Task.WhenAll(ratingsTask, bettingLinesTask).ConfigureAwait(false);

        var ratings = ratingsTask.Result;
        var bettingLines = bettingLinesTask.Result;

        var upcomingGames = fullSchedule
            .Where(g => g.HomeTeam is not null && fbsTeamNames.Contains(g.HomeTeam)
                && g.AwayTeam is not null && fbsTeamNames.Contains(g.AwayTeam)
                && (isPostseason
                    ? g.SeasonType is not null && g.SeasonType.Equals("postseason", scoic)
                    : g.Week == gameWeek))
            .ToList();

        _logger.LogDebug("Found {GameCount} FBS vs FBS games for season {Season}, week {Week}",
            upcomingGames.Count, season, week);

        var gamePredictions = await _predictionCalculatorModule
            .GeneratePredictionsAsync(seasonData, ratings, upcomingGames, bettingLines)
            .ConfigureAwait(false);

        var predictionsResult = new PredictionsResult
        {
            Predictions = gamePredictions.ToList(),
            Season = season,
            Week = week
        };

        var persisted = true;
        try
        {
            await _predictionsModule.SaveAsync(predictionsResult).ConfigureAwait(false);
            _logger.LogInformation("Saved draft predictions for season {Season}, week {Week}", season, week);
        }
        catch (Exception ex)
        {
            persisted = false;
            _logger.LogWarning(ex, "Failed to persist predictions for season {Season}, week {Week}", season, week);
        }

        return new CalculatePredictionsResult
        {
            IsPersisted = persisted,
            Predictions = predictionsResult
        };
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

            await _pollLeadersModule.InvalidateCacheAsync().ConfigureAwait(false);
            await _seasonTrendsModule.InvalidateCacheAsync().ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            persisted = false;
            _logger.LogWarning(ex, "Failed to persist snapshot for season {Season}, week {Week}", season, week);
        }

        return new CalculateRankingsResult
        {
            IsPersisted = persisted,
            Rankings = rankings
        };
    }

    public async Task<bool> DeletePredictionsAsync(int season, int week)
    {
        _logger.LogInformation("Deleting predictions for season {Season}, week {Week}", season, week);

        return await _predictionsModule.DeleteAsync(season, week).ConfigureAwait(false);
    }

    public async Task<bool> DeleteSnapshotAsync(int season, int week)
    {
        _logger.LogInformation("Deleting snapshot for season {Season}, week {Week}", season, week);

        var result = await _rankingsModule.DeleteSnapshotAsync(season, week).ConfigureAwait(false);

        if (result)
        {
            await _pollLeadersModule.InvalidateCacheAsync().ConfigureAwait(false);
            await _seasonTrendsModule.InvalidateCacheAsync().ConfigureAwait(false);
        }

        return result;
    }

    public async Task<byte[]?> ExportRankingsAsync(int season, int week)
    {
        _logger.LogInformation("Exporting rankings for season {Season}, week {Week}", season, week);

        var snapshot = await _rankingsModule.GetSnapshotAsync(season, week).ConfigureAwait(false);

        if (snapshot is null)
            return null;

        return _excelExportModule.GenerateRankingsWorkbook(snapshot);
    }

    public async Task<IEnumerable<PredictionsSummary>> GetPredictionsSummariesAsync()
    {
        return await _predictionsModule.GetAllSummariesAsync().ConfigureAwait(false);
    }

    public async Task<IEnumerable<SnapshotSummary>> GetSnapshotsAsync()
    {
        return await _rankingsModule.GetSnapshotsAsync().ConfigureAwait(false);
    }

    public async Task<bool> PublishPredictionsAsync(int season, int week)
    {
        _logger.LogInformation("Publishing predictions for season {Season}, week {Week}", season, week);

        return await _predictionsModule.PublishAsync(season, week).ConfigureAwait(false);
    }

    public async Task<bool> PublishSnapshotAsync(int season, int week)
    {
        _logger.LogInformation("Publishing snapshot for season {Season}, week {Week}", season, week);

        var result = await _rankingsModule.PublishSnapshotAsync(season, week).ConfigureAwait(false);

        if (result)
        {
            await _pollLeadersModule.InvalidateCacheAsync().ConfigureAwait(false);
            await _seasonTrendsModule.InvalidateCacheAsync().ConfigureAwait(false);
        }

        return result;
    }

    private async Task ClearSeasonCacheAsync(int season, int week)
    {
        var gameWeek = week + 1;
        var cacheKeys = new List<string>
        {
            $"advancedGameStats_{season}_postseason",
            $"advancedGameStats_{season}_regular",
            $"bettingLines_{season}_{gameWeek}",
            $"games_{season}_postseason",
            $"games_{season}_regular",
            $"seasonStats_{season}",
            $"seasonStats_{season}_week_{week}",
            $"teams_{season}"
        };

        // CFBD API serves postseason betting lines under week 1; clear that key too if different
        if (gameWeek != 1)
        {
            cacheKeys.Add($"bettingLines_{season}_1");
        }

        foreach (var key in cacheKeys)
        {
            await _cache.RemoveAsync(key).ConfigureAwait(false);
        }
    }
}
