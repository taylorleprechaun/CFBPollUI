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
    private readonly IPredictionGradingModule _predictionGradingModule;
    private readonly IPredictionsModule _predictionsModule;
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingAlgorithmResolver _ratingAlgorithmResolver;
    private readonly ISeasonModule _seasonModule;
    private readonly ISeasonTrendsModule _seasonTrendsModule;
    private readonly ITeamPredictionRecordModule _teamPredictionRecordModule;
    private readonly ITrackRecordModule _trackRecordModule;

    public AdminModule(
        ICFBDataService dataService,
        IExcelExportModule excelExportModule,
        IPersistentCache cache,
        IPollLeadersModule pollLeadersModule,
        IPredictionCalculatorModule predictionCalculatorModule,
        IPredictionGradingModule predictionGradingModule,
        IPredictionsModule predictionsModule,
        IRankingsModule rankingsModule,
        IRatingAlgorithmResolver ratingAlgorithmResolver,
        ISeasonModule seasonModule,
        ISeasonTrendsModule seasonTrendsModule,
        ITeamPredictionRecordModule teamPredictionRecordModule,
        ITrackRecordModule trackRecordModule,
        ILogger<AdminModule> logger)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _excelExportModule = excelExportModule ?? throw new ArgumentNullException(nameof(excelExportModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _pollLeadersModule = pollLeadersModule ?? throw new ArgumentNullException(nameof(pollLeadersModule));
        _predictionCalculatorModule = predictionCalculatorModule ?? throw new ArgumentNullException(nameof(predictionCalculatorModule));
        _predictionGradingModule = predictionGradingModule ?? throw new ArgumentNullException(nameof(predictionGradingModule));
        _predictionsModule = predictionsModule ?? throw new ArgumentNullException(nameof(predictionsModule));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _ratingAlgorithmResolver = ratingAlgorithmResolver ?? throw new ArgumentNullException(nameof(ratingAlgorithmResolver));
        _seasonModule = seasonModule ?? throw new ArgumentNullException(nameof(seasonModule));
        _seasonTrendsModule = seasonTrendsModule ?? throw new ArgumentNullException(nameof(seasonTrendsModule));
        _teamPredictionRecordModule = teamPredictionRecordModule ?? throw new ArgumentNullException(nameof(teamPredictionRecordModule));
        _trackRecordModule = trackRecordModule ?? throw new ArgumentNullException(nameof(trackRecordModule));
    }

    public async Task<ExperimentalCalculateResult> CalculateExperimentalAsync(int season, int week, RatingAlgorithmVersion algorithmVersion)
    {
        _logger.LogInformation(
            "Calculating experimental rankings for season {Season}, week {Week} using algorithm version {AlgorithmVersion}",
            season, week, algorithmVersion);

        var seasonData = await _dataService.GetSeasonDataAsync(season, week).ConfigureAwait(false);
        var ratings = await _ratingAlgorithmResolver.Resolve(algorithmVersion).RateTeamsAsync(seasonData).ConfigureAwait(false);
        var rankings = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings).ConfigureAwait(false);

        return new ExperimentalCalculateResult
        {
            AlgorithmVersion = algorithmVersion,
            Rankings = rankings
        };
    }

    public async Task<SeasonTrendsResult> CalculateExperimentalSeasonTrendsAsync(int season, RatingAlgorithmVersion algorithmVersion)
    {
        _logger.LogInformation(
            "Calculating experimental season trends for season {Season} using algorithm version {AlgorithmVersion}",
            season, algorithmVersion);

        var calendar = await _dataService.GetCalendarAsync(season).ConfigureAwait(false);
        var weekNumbers = _seasonModule.GetWeekLabels(calendar).Select(w => w.WeekNumber).ToList();

        var weekTasks = weekNumbers
            .Select(week => CalculateExperimentalAsync(season, week, algorithmVersion))
            .ToList();
        await Task.WhenAll(weekTasks).ConfigureAwait(false);

        var weeklyRankings = weekTasks
            .Select(t => t.Result.Rankings)
            .OrderBy(r => r.Week)
            .ToList();

        return await _seasonTrendsModule.BuildFromRankingsAsync(season, weeklyRankings).ConfigureAwait(false);
    }

    public async Task<CalculatePredictionsResult> CalculatePredictionsAsync(int season, int week)
    {
        _logger.LogInformation("Calculating predictions for season {Season}, week {Week}", season, week);

        await RefreshSeasonCacheAsync(season, week).ConfigureAwait(false);

        var seasonDataTask = _dataService.GetSeasonDataAsync(season, week);
        var fullScheduleTask = _dataService.GetFullSeasonScheduleAsync(season);
        await Task.WhenAll(seasonDataTask, fullScheduleTask).ConfigureAwait(false);

        var seasonData = seasonDataTask.Result;
        var fullSchedule = fullScheduleTask.Result;
        var (gameWeek, isPostseason) = GameWeekResolver.Resolve(week, fullSchedule);
        var fbsTeamNames = new HashSet<string>(seasonData.Teams.Keys, StringComparer.OrdinalIgnoreCase);
        var scoic = StringComparison.OrdinalIgnoreCase;

        // CFBD API serves all postseason betting lines under week 1
        var bettingLinesWeek = isPostseason ? 1 : gameWeek;

        var ratingsTask = _ratingAlgorithmResolver.ResolveForPredictions().RateTeamsAsync(seasonData);
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

        await RefreshSeasonCacheAsync(season, week).ConfigureAwait(false);

        var seasonData = await _dataService.GetSeasonDataAsync(season, week).ConfigureAwait(false);
        var algorithmVersion = _ratingAlgorithmResolver.ResolveVersionForSeason(season);
        var ratings = await _ratingAlgorithmResolver.Resolve(algorithmVersion).RateTeamsAsync(seasonData).ConfigureAwait(false);
        var rankings = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings).ConfigureAwait(false);

        var persisted = true;
        try
        {
            await _rankingsModule.SaveSnapshotAsync(rankings, algorithmVersion).ConfigureAwait(false);
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

        var result = await _predictionsModule.DeleteAsync(season, week).ConfigureAwait(false);

        if (result)
        {
            await _teamPredictionRecordModule.InvalidateCacheAsync().ConfigureAwait(false);
            await _trackRecordModule.InvalidateCacheAsync().ConfigureAwait(false);
        }

        return result;
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

    public async Task<byte[]> ExportExperimentalAsync(int season, int week, RatingAlgorithmVersion algorithmVersion)
    {
        _logger.LogInformation(
            "Exporting experimental rankings for season {Season}, week {Week} using algorithm version {AlgorithmVersion}",
            season, week, algorithmVersion);

        var result = await CalculateExperimentalAsync(season, week, algorithmVersion).ConfigureAwait(false);

        return _excelExportModule.GenerateRankingsWorkbook(result.Rankings);
    }

    public async Task<byte[]?> ExportRankingsAsync(int season, int week)
    {
        _logger.LogInformation("Exporting rankings for season {Season}, week {Week}", season, week);

        var snapshot = await _rankingsModule.GetSnapshotAsync(season, week).ConfigureAwait(false);

        if (snapshot is null)
            return null;

        return _excelExportModule.GenerateRankingsWorkbook(snapshot);
    }

    public async Task<GetPredictionsResult?> GetPredictionsAsync(int season, int week)
    {
        var predictionsTask = _predictionsModule.GetAsync(season, week);
        var summariesTask = _predictionsModule.GetAllSummariesAsync();
        await Task.WhenAll(predictionsTask, summariesTask).ConfigureAwait(false);

        var predictions = predictionsTask.Result;
        if (predictions is null)
            return null;

        var summary = summariesTask.Result.FirstOrDefault(s => s.Season == season && s.Week == week);

        return new GetPredictionsResult
        {
            IsGraded = summary?.IsGraded ?? false,
            IsPublished = summary?.IsPublished ?? false,
            Predictions = predictions,
            ResultsPublished = summary?.ResultsPublished ?? false
        };
    }

    public async Task<IEnumerable<PredictionsSummary>> GetPredictionsSummariesAsync()
    {
        return await _predictionsModule.GetAllSummariesAsync().ConfigureAwait(false);
    }

    public async Task<IEnumerable<SnapshotSummary>> GetSnapshotsAsync()
    {
        return await _rankingsModule.GetSnapshotsAsync().ConfigureAwait(false);
    }

    public async Task<GradePredictionsResult?> GradePredictionsAsync(int season, int week)
    {
        return await _predictionGradingModule.GradeAsync(season, week).ConfigureAwait(false);
    }

    public async Task<bool> PublishGradedResultsAsync(int season, int week)
    {
        _logger.LogInformation("Publishing graded results for season {Season}, week {Week}", season, week);

        var result = await _predictionsModule.PublishGradedResultsAsync(season, week).ConfigureAwait(false);

        if (result)
        {
            await _teamPredictionRecordModule.InvalidateCacheAsync().ConfigureAwait(false);
            await _trackRecordModule.InvalidateCacheAsync().ConfigureAwait(false);
        }

        return result;
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

    public async Task<int> RefreshSeasonCacheAsync(int season, int week)
    {
        _logger.LogInformation("Refreshing cached CFBD data for season {Season}, week {Week}", season, week);

        var removed = 0;
        foreach (var key in CacheKeys.GetSeasonScopedKeys(season, week))
        {
            if (await _cache.RemoveAsync(key).ConfigureAwait(false))
            {
                removed++;
            }
        }

        _logger.LogInformation("Removed {Count} cached entries for season {Season}, week {Week}", removed, season, week);
        return removed;
    }
}
