using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Modules;

public class AdminModule : IAdminModule
{
    /// <summary>
    /// Caps the calibration analysis's per-week betting-line fetches. Lines are cached per week, so on a cold
    /// cache each one is a separate CFBD request.
    /// </summary>
    private const int MAX_CONCURRENT_LINE_FETCHES = 4;

    /// <summary>
    /// Caps how many weeks <see cref="CalculateExperimentalSeasonPredictionsAsync"/> calculates concurrently.
    /// Each week loads a full <see cref="SeasonData"/> into memory, so an unbounded fan-out scales memory
    /// linearly with the number of weeks requested.
    /// </summary>
    private const int MAX_CONCURRENT_SEASON_WEEK_CALCULATIONS = 4;

    private readonly IPersistentCache _cache;
    private readonly ICFBDataCacheRefresher _cacheRefresher;
    private readonly ICFBDataService _dataService;
    private readonly IExcelExportModule _excelExportModule;
    private readonly ILogger<AdminModule> _logger;
    private readonly IPollLeadersModule _pollLeadersModule;
    private readonly IPredictionAlgorithmResolver _predictionAlgorithmResolver;
    private readonly IPredictionCalibrationModule _predictionCalibrationModule;
    private readonly IPredictionGradingModule _predictionGradingModule;
    private readonly IPredictionsModule _predictionsModule;
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingAlgorithmResolver _ratingAlgorithmResolver;
    private readonly ISeasonModule _seasonModule;
    private readonly ISeasonTrendsModule _seasonTrendsModule;
    private readonly ITeamPredictionRecordModule _teamPredictionRecordModule;
    private readonly TimeProvider _timeProvider;
    private readonly ITrackRecordModule _trackRecordModule;

    public AdminModule(
        ICFBDataService dataService,
        IExcelExportModule excelExportModule,
        IPersistentCache cache,
        ICFBDataCacheRefresher cacheRefresher,
        IPollLeadersModule pollLeadersModule,
        IPredictionAlgorithmResolver predictionAlgorithmResolver,
        IPredictionCalibrationModule predictionCalibrationModule,
        IPredictionGradingModule predictionGradingModule,
        IPredictionsModule predictionsModule,
        IRankingsModule rankingsModule,
        IRatingAlgorithmResolver ratingAlgorithmResolver,
        ISeasonModule seasonModule,
        ISeasonTrendsModule seasonTrendsModule,
        ITeamPredictionRecordModule teamPredictionRecordModule,
        TimeProvider timeProvider,
        ITrackRecordModule trackRecordModule,
        ILogger<AdminModule> logger)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _cacheRefresher = cacheRefresher ?? throw new ArgumentNullException(nameof(cacheRefresher));
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _excelExportModule = excelExportModule ?? throw new ArgumentNullException(nameof(excelExportModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _pollLeadersModule = pollLeadersModule ?? throw new ArgumentNullException(nameof(pollLeadersModule));
        _predictionAlgorithmResolver = predictionAlgorithmResolver ?? throw new ArgumentNullException(nameof(predictionAlgorithmResolver));
        _predictionCalibrationModule = predictionCalibrationModule ?? throw new ArgumentNullException(nameof(predictionCalibrationModule));
        _predictionGradingModule = predictionGradingModule ?? throw new ArgumentNullException(nameof(predictionGradingModule));
        _predictionsModule = predictionsModule ?? throw new ArgumentNullException(nameof(predictionsModule));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _ratingAlgorithmResolver = ratingAlgorithmResolver ?? throw new ArgumentNullException(nameof(ratingAlgorithmResolver));
        _seasonModule = seasonModule ?? throw new ArgumentNullException(nameof(seasonModule));
        _seasonTrendsModule = seasonTrendsModule ?? throw new ArgumentNullException(nameof(seasonTrendsModule));
        _teamPredictionRecordModule = teamPredictionRecordModule ?? throw new ArgumentNullException(nameof(teamPredictionRecordModule));
        _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
        _trackRecordModule = trackRecordModule ?? throw new ArgumentNullException(nameof(trackRecordModule));
    }

    public async Task<AddNewPredictionGamesResult> AddNewPredictionGamesAsync(int season, int week, IEnumerable<GamePrediction> games)
    {
        ArgumentNullException.ThrowIfNull(games);

        _logger.LogInformation("Adding new games to predictions for season {Season}, week {Week}", season, week);

        // The predictions come from the admin's preview; only whether each game can still be added is re-checked,
        // against the cached schedule so adding needs no CFBD calls and no model run.
        var (outcome, stored, newGames) = await FindNewScheduledGamesAsync(season, week, refreshCache: false).ConfigureAwait(false);
        if (outcome != NewPredictionGamesOutcome.Success || stored is null)
            return new AddNewPredictionGamesResult { Outcome = outcome };

        var eligibleKeys = newGames
            .SelectMany(g => new[] { PredictionGrader.BuildMatchKey(g.HomeTeam!, g.AwayTeam!), PredictionGrader.BuildMatchKey(g.AwayTeam!, g.HomeTeam!) })
            .ToHashSet();
        var gamesToAdd = games
            .Where(g => g.BettingSpread.HasValue && eligibleKeys.Contains(PredictionGrader.BuildMatchKey(g.HomeTeam, g.AwayTeam)))
            .DistinctBy(g => PredictionGrader.BuildMatchKey(g.HomeTeam, g.AwayTeam))
            .ToList();
        if (gamesToAdd.Count == 0)
            return new AddNewPredictionGamesResult { Outcome = NewPredictionGamesOutcome.NoneEligible };

        var updated = new PredictionsResult
        {
            AppliedCalibration = stored.AppliedCalibration,
            Predictions = [.. stored.Predictions, .. gamesToAdd],
            Season = stored.Season,
            Week = stored.Week
        };

        if (!await _predictionsModule.UpdatePredictionsAsync(updated).ConfigureAwait(false))
            return new AddNewPredictionGamesResult { Outcome = NewPredictionGamesOutcome.NotFound };

        _logger.LogInformation("Added {AddedCount} new games to predictions for season {Season}, week {Week}", gamesToAdd.Count, season, week);

        var current = await GetPredictionsAsync(season, week).ConfigureAwait(false);
        if (current?.ResultsPublished == true)
        {
            await _teamPredictionRecordModule.InvalidateCacheAsync().ConfigureAwait(false);
            await _trackRecordModule.InvalidateCacheAsync().ConfigureAwait(false);
        }

        return new AddNewPredictionGamesResult
        {
            AddedGameCount = gamesToAdd.Count,
            Outcome = NewPredictionGamesOutcome.Success,
            Predictions = current
        };
    }

    public async Task<AnalyzePredictionCalibrationResult> AnalyzePredictionCalibrationAsync(int season, int week, IReadOnlyDictionary<string, double>? candidate)
    {
        if (_predictionAlgorithmResolver.ResolveForSeason(season) is not ICalibratedPredictionCalculator calibratedCalculator)
            return new AnalyzePredictionCalibrationResult { Outcome = AnalyzePredictionCalibrationOutcome.NotSupported };

        var parameters = calibratedCalculator.CalibrationParameters;
        if (candidate is not null)
        {
            var validationError = ValidateCalibrationValues(candidate, parameters);
            if (validationError is not null)
                return new AnalyzePredictionCalibrationResult { ErrorMessage = validationError, Outcome = AnalyzePredictionCalibrationOutcome.InvalidValues };
        }

        _logger.LogInformation("Analyzing prediction calibration for season {Season}, week {Week}", season, week);

        var seasonDataTask = _dataService.GetSeasonDataAsync(season, week);
        var fullScheduleTask = _dataService.GetFullSeasonScheduleAsync(season);
        var summariesTask = _predictionsModule.GetAllSummariesAsync();
        await Task.WhenAll(seasonDataTask, fullScheduleTask, summariesTask).ConfigureAwait(false);

        var snapshotWeeks = summariesTask.Result.Where(s => s.Season == season && s.Week < week).Select(s => s.Week).ToList();
        var snapshots = (await Task.WhenAll(snapshotWeeks.Select(w => _predictionsModule.GetAsync(season, w))).ConfigureAwait(false))
            .Where(s => s is not null)
            .Select(s => s!)
            .ToList();

        var linesTask = BuildCalibrationLineHistoryAsync(season, week, snapshots, fullScheduleTask.Result);
        var appliedTask = BuildAppliedCalibrationByWeekAsync(season, week, snapshots, parameters);
        await Task.WhenAll(linesTask, appliedTask).ConfigureAwait(false);

        var analysis = await calibratedCalculator
            .AnalyzeCalibrationAsync(seasonDataTask.Result, linesTask.Result, appliedTask.Result, candidate)
            .ConfigureAwait(false);

        return new AnalyzePredictionCalibrationResult { Analysis = analysis, Outcome = AnalyzePredictionCalibrationOutcome.Success };
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

    public async Task<ExperimentalMatchupResult> CalculateExperimentalMatchupAsync(
        int season, int week, RatingAlgorithmVersion algorithmVersion, string homeTeam, string awayTeam, bool neutralSite)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(homeTeam);
        ArgumentException.ThrowIfNullOrWhiteSpace(awayTeam);

        _logger.LogInformation(
            "Calculating experimental matchup {AwayTeam} at {HomeTeam} (neutral: {NeutralSite}) for season {Season}, week {Week} using algorithm version {AlgorithmVersion}",
            awayTeam, homeTeam, neutralSite, season, week, algorithmVersion);

        var fbsTeams = await _dataService.GetFBSTeamsAsync(season).ConfigureAwait(false);
        var canonicalNames = fbsTeams
            .Select(t => t.Name)
            .Where(n => !string.IsNullOrEmpty(n))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToDictionary(n => n, StringComparer.OrdinalIgnoreCase);

        if (!canonicalNames.TryGetValue(homeTeam, out var canonicalHome)
            || !canonicalNames.TryGetValue(awayTeam, out var canonicalAway)
            || canonicalHome.Equals(canonicalAway, StringComparison.OrdinalIgnoreCase))
        {
            return new ExperimentalMatchupResult
            {
                AlgorithmVersion = algorithmVersion,
                Outcome = ExperimentalMatchupOutcome.InvalidTeam
            };
        }

        var seasonDataTask = _dataService.GetSeasonDataAsync(season, week);
        var fullScheduleTask = _dataService.GetFullSeasonScheduleAsync(season);
        await Task.WhenAll(seasonDataTask, fullScheduleTask).ConfigureAwait(false);

        var seasonData = seasonDataTask.Result;
        var fullSchedule = fullScheduleTask.Result;
        var (gameWeek, isPostseason) = GameWeekResolver.Resolve(week, fullSchedule);

        // A real game's published line applies only when the matchup is exactly that game: same teams,
        // same home/away orientation, and same neutral-site flag. Anything else is purely hypothetical.
        var scheduledGame = FindExactScheduledGame(fullSchedule, canonicalHome, canonicalAway, neutralSite, gameWeek, isPostseason);

        // CFBD API serves all postseason betting lines under week 1
        var bettingLinesTask = scheduledGame?.GameID is not null
            ? _dataService.GetBettingLinesAsync(season, isPostseason ? 1 : gameWeek)
            : Task.FromResult<IEnumerable<BettingLine>>([]);
        var ratingsTask = _ratingAlgorithmResolver.ResolveForPredictions().RateTeamsAsync(seasonData);
        var seasonMeetingsTask = FindSeasonMeetingsAsync(season, fullSchedule, canonicalHome, canonicalAway, gameWeek, isPostseason);
        await Task.WhenAll(bettingLinesTask, ratingsTask, seasonMeetingsTask).ConfigureAwait(false);

        var matchupGame = new ScheduleGame
        {
            AwayTeam = canonicalAway,
            GameID = scheduledGame?.GameID,
            HomeTeam = canonicalHome,
            NeutralSite = neutralSite,
            SeasonType = isPostseason ? "postseason" : "regular",
            Week = gameWeek
        };

        var (predictions, appliedCalibration) = await GenerateExperimentalPredictionsAsync(algorithmVersion, season, week, seasonData, ratingsTask.Result, [matchupGame], bettingLinesTask.Result)
            .ConfigureAwait(false);

        return new ExperimentalMatchupResult
        {
            ActualGames = seasonMeetingsTask.Result,
            AlgorithmVersion = algorithmVersion,
            AppliedCalibration = appliedCalibration,
            Outcome = ExperimentalMatchupOutcome.Success,
            Prediction = predictions.FirstOrDefault()
        };
    }

    public async Task<ExperimentalPredictionsResult> CalculateExperimentalPredictionsAsync(int season, int week, RatingAlgorithmVersion algorithmVersion)
    {
        _logger.LogInformation(
            "Calculating experimental predictions for season {Season}, week {Week} using algorithm version {AlgorithmVersion}",
            season, week, algorithmVersion);

        var seasonDataTask = _dataService.GetSeasonDataAsync(season, week);
        var fullScheduleTask = _dataService.GetFullSeasonScheduleAsync(season);
        await Task.WhenAll(seasonDataTask, fullScheduleTask).ConfigureAwait(false);

        var seasonData = seasonDataTask.Result;
        var fullSchedule = fullScheduleTask.Result;
        var (gameWeek, isPostseason) = GameWeekResolver.Resolve(week, fullSchedule);
        var fbsTeamNames = new HashSet<string>(seasonData.Teams.Keys, StringComparer.OrdinalIgnoreCase);

        // CFBD API serves all postseason betting lines under week 1
        var bettingLinesWeek = isPostseason ? 1 : gameWeek;

        var ratingsTask = _ratingAlgorithmResolver.ResolveForPredictions().RateTeamsAsync(seasonData);
        var bettingLinesTask = _dataService.GetBettingLinesAsync(season, bettingLinesWeek);
        var completedGamesTask = _dataService.GetGamesAsync(season, isPostseason ? "postseason" : "regular");
        await Task.WhenAll(ratingsTask, bettingLinesTask, completedGamesTask).ConfigureAwait(false);

        var ratings = ratingsTask.Result;
        var bettingLines = bettingLinesTask.Result;
        var completedGames = isPostseason
            ? completedGamesTask.Result
            : completedGamesTask.Result.Where(g => g.Week == gameWeek);

        var upcomingGames = SelectWeekGames(fullSchedule, fbsTeamNames, gameWeek, isPostseason);

        var (gamePredictions, appliedCalibration) = await GenerateExperimentalPredictionsAsync(algorithmVersion, season, week, seasonData, ratings, upcomingGames, bettingLines)
            .ConfigureAwait(false);
        var predictions = gamePredictions.ToList();

        var resultsByGame = completedGames
            .Where(g => g.HomeTeam is not null && g.AwayTeam is not null && g.HomePoints.HasValue && g.AwayPoints.HasValue)
            .GroupBy(g => PredictionGrader.BuildMatchKey(g.HomeTeam!, g.AwayTeam!))
            .ToDictionary(g => g.Key, g => g.First());

        foreach (var prediction in predictions)
        {
            if (resultsByGame.TryGetValue(PredictionGrader.BuildMatchKey(prediction.HomeTeam, prediction.AwayTeam), out var game))
                PredictionGrader.Grade(prediction, game.HomePoints!.Value, game.AwayPoints!.Value);
        }

        return new ExperimentalPredictionsResult
        {
            AlgorithmVersion = algorithmVersion,
            AppliedCalibration = appliedCalibration,
            Predictions = predictions,
            Summary = PredictionRecordSummarizer.Summarize(predictions)
        };
    }

    public async Task<SeasonExperimentalPredictionsResult> CalculateExperimentalSeasonPredictionsAsync(int season, IEnumerable<int> weeks, RatingAlgorithmVersion algorithmVersion)
    {
        ArgumentNullException.ThrowIfNull(weeks);

        var weekNumbers = weeks.ToList();

        _logger.LogInformation(
            "Calculating experimental season predictions for season {Season}, weeks {Weeks} using algorithm version {AlgorithmVersion}",
            season, string.Join(",", weekNumbers), algorithmVersion);

        if (weekNumbers.Count > 0)
        {
            // Warm the season-scoped caches (full schedule, teams, games, advanced stats) with one
            // sequential call before fanning out per week below. Without this, every week misses the
            // same season-level cache keys at once and stampedes the underlying data provider with
            // duplicate live requests, which can trip its rate limit on a season nothing has cached yet.
            await _dataService.GetFullSeasonScheduleAsync(season).ConfigureAwait(false);
            await _dataService.GetSeasonDataAsync(season, weekNumbers[0]).ConfigureAwait(false);
        }

        using var throttle = new SemaphoreSlim(MAX_CONCURRENT_SEASON_WEEK_CALCULATIONS);
        var weekTasks = weekNumbers
            .Select(week => CalculateThrottledExperimentalPredictionsAsync(season, week, algorithmVersion, throttle))
            .ToList();
        await Task.WhenAll(weekTasks).ConfigureAwait(false);

        var weeklyResults = weekNumbers
            .Zip(weekTasks, (week, task) => new SeasonExperimentalPredictionsWeek { AppliedCalibration = task.Result.AppliedCalibration, Summary = task.Result.Summary, Week = week })
            .OrderBy(w => w.Week)
            .ToList();
        var allPredictions = weekTasks.SelectMany(t => t.Result.Predictions);

        return new SeasonExperimentalPredictionsResult
        {
            AlgorithmVersion = algorithmVersion,
            OverallSummary = PredictionRecordSummarizer.Summarize(allPredictions),
            Season = season,
            Weeks = weeklyResults
        };
    }

    public async Task<SeasonTrendsResult> CalculateExperimentalSeasonTrendsAsync(int season, RatingAlgorithmVersion algorithmVersion)
    {
        _logger.LogInformation(
            "Calculating experimental season trends for season {Season} using algorithm version {AlgorithmVersion}",
            season, algorithmVersion);

        var calendar = await _dataService.GetCalendarAsync(season).ConfigureAwait(false);
        var weekNumbers = _seasonModule.GetWeekLabels(calendar, []).Select(w => w.WeekNumber).ToList();

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

        // CFBD API serves all postseason betting lines under week 1
        var bettingLinesWeek = isPostseason ? 1 : gameWeek;

        var ratingsTask = _ratingAlgorithmResolver.ResolveForPredictions().RateTeamsAsync(seasonData);
        var bettingLinesTask = _dataService.GetBettingLinesAsync(season, bettingLinesWeek);
        await Task.WhenAll(ratingsTask, bettingLinesTask).ConfigureAwait(false);

        var ratings = ratingsTask.Result;
        var bettingLines = bettingLinesTask.Result;

        var upcomingGames = SelectWeekGames(fullSchedule, fbsTeamNames, gameWeek, isPostseason);

        _logger.LogDebug("Found {GameCount} FBS vs FBS games for season {Season}, week {Week}",
            upcomingGames.Count, season, week);

        var (gamePredictions, appliedCalibration) = await GeneratePredictionsWithCalibrationAsync(_predictionAlgorithmResolver.ResolveForSeason(season), parameters => ResolveCalibrationForCalculationAsync(season, week, parameters), seasonData, ratings, upcomingGames, bettingLines)
            .ConfigureAwait(false);

        var predictionsResult = new PredictionsResult
        {
            AppliedCalibration = appliedCalibration,
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
            await _rankingsModule.SaveRankingsSnapshotAsync(rankings, algorithmVersion).ConfigureAwait(false);
            _logger.LogInformation("Saved draft rankings snapshot for season {Season}, week {Week}", season, week);

            await _pollLeadersModule.InvalidateCacheAsync().ConfigureAwait(false);
            await _seasonTrendsModule.InvalidateCacheAsync().ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            persisted = false;
            _logger.LogWarning(ex, "Failed to persist rankings snapshot for season {Season}, week {Week}", season, week);
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

    public async Task<bool> DeleteRankingsSnapshotAsync(int season, int week)
    {
        _logger.LogInformation("Deleting rankings snapshot for season {Season}, week {Week}", season, week);

        var result = await _rankingsModule.DeleteRankingsSnapshotAsync(season, week).ConfigureAwait(false);

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

    public async Task<byte[]?> ExportPredictionsAsync(int season, int week)
    {
        _logger.LogInformation("Exporting predictions for season {Season}, week {Week}", season, week);

        var predictions = await _predictionsModule.GetAsync(season, week).ConfigureAwait(false);

        if (predictions is null)
            return null;

        return _excelExportModule.GeneratePredictionsWorkbook(predictions);
    }

    public async Task<byte[]?> ExportRankingsAsync(int season, int week)
    {
        _logger.LogInformation("Exporting rankings for season {Season}, week {Week}", season, week);

        var rankingsSnapshot = await _rankingsModule.GetRankingsSnapshotAsync(season, week).ConfigureAwait(false);

        if (rankingsSnapshot is null)
            return null;

        return _excelExportModule.GenerateRankingsWorkbook(rankingsSnapshot);
    }

    public async Task<IEnumerable<CacheEntrySummary>> GetCacheEntriesAsync()
    {
        var entries = await _cache.GetAllEntriesMetadataAsync().ConfigureAwait(false);
        return entries.Select(CacheKeyDescriptor.Describe);
    }

    public async Task<CFBDUsage> GetCFBDUsageAsync(bool forceRefresh = false)
    {
        return await _dataService.GetCFBDUsageAsync(forceRefresh).ConfigureAwait(false);
    }

    public async Task<IEnumerable<string>> GetFBSTeamNamesAsync(int season)
    {
        var teams = await _dataService.GetFBSTeamsAsync(season).ConfigureAwait(false);

        return teams
            .Select(t => t.Name)
            .Where(n => !string.IsNullOrEmpty(n))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(n => n, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async Task<IEnumerable<ScheduleGame>> GetIncompleteGamesAsync(int season, int week)
    {
        var calendarTask = _dataService.GetCalendarAsync(season);
        var fullScheduleTask = _dataService.GetFullSeasonScheduleAsync(season);
        await Task.WhenAll(calendarTask, fullScheduleTask).ConfigureAwait(false);

        var calendarWeek = (await calendarTask).FirstOrDefault(w => w.Week == week);
        var fullSchedule = await fullScheduleTask;
        var seasonType = calendarWeek?.SeasonType ?? string.Empty;

        return _seasonModule.GetIncompleteGames(week, seasonType, fullSchedule);
    }

    public async Task<PredictionCalibrationView> GetPredictionCalibrationAsync(int season, int week)
    {
        if (_predictionAlgorithmResolver.ResolveForSeason(season) is not ICalibratedPredictionCalculator calibratedCalculator)
            return new PredictionCalibrationView { IsSupported = false, Season = season, Week = week };

        var parameters = calibratedCalculator.CalibrationParameters;

        var storedTask = _predictionCalibrationModule.GetAsync(season, week, parameters);
        var predictionsTask = _predictionsModule.GetAsync(season, week);
        var publishedWeeksTask = _predictionsModule.GetPublishedWeekNumbersAsync(season);
        await Task.WhenAll(storedTask, predictionsTask, publishedWeeksTask).ConfigureAwait(false);

        var stored = storedTask.Result;
        var calibration = stored
            ?? await _predictionCalibrationModule.ResolveCarriedForwardAsync(season, week, parameters).ConfigureAwait(false);
        var isLocked = publishedWeeksTask.Result.Contains(week);
        var snapshot = predictionsTask.Result;

        return new PredictionCalibrationView
        {
            Calibration = calibration,
            DraftUsesDifferentValues = snapshot is not null
                && !HaveSameCalibrationValues(snapshot.AppliedCalibration, calibration.Values, parameters),
            IsLocked = isLocked,
            IsStored = stored is not null,
            IsSupported = true,
            Parameters = parameters,
            Season = season,
            Week = week
        };
    }

    public async Task<IEnumerable<PredictionCalibrationHistoryEntry>> GetPredictionCalibrationHistoryAsync(int season)
    {
        var calibrationsTask = _predictionCalibrationModule.GetSeasonAsync(season);
        var publishedWeeksTask = _predictionsModule.GetPublishedWeekNumbersAsync(season);
        await Task.WhenAll(calibrationsTask, publishedWeeksTask).ConfigureAwait(false);

        var publishedWeeks = publishedWeeksTask.Result.ToHashSet();

        return calibrationsTask.Result
            .Select(c => new PredictionCalibrationHistoryEntry { Calibration = c, IsLocked = publishedWeeks.Contains(c.Week) })
            .ToList();
    }

    public async Task<GetPredictionsResult?> GetPredictionsAsync(int season, int week)
    {
        var predictionsTask = _predictionsModule.GetAsync(season, week);
        var summariesTask = _predictionsModule.GetAllSummariesAsync();
        var fullScheduleTask = _dataService.GetFullSeasonScheduleAsync(season);
        await Task.WhenAll(predictionsTask, summariesTask, fullScheduleTask).ConfigureAwait(false);

        var predictions = predictionsTask.Result;
        if (predictions is null)
            return null;

        var summary = summariesTask.Result.FirstOrDefault(s => s.Season == season && s.Week == week);
        var isPostseason = IsPostseasonWeek(week, fullScheduleTask.Result);

        return new GetPredictionsResult
        {
            IsGraded = summary?.IsGraded ?? false,
            IsPostseason = isPostseason,
            IsPublished = summary?.IsPublished ?? false,
            Predictions = predictions,
            ResultsPublished = summary?.ResultsPublished ?? false
        };
    }

    public async Task<IEnumerable<PredictionsSummary>> GetPredictionsSummariesAsync()
    {
        return await _predictionsModule.GetAllSummariesAsync().ConfigureAwait(false);
    }

    public async Task<GetRankingsSnapshotResult?> GetRankingsSnapshotAsync(int season, int week)
    {
        var rankingsTask = _rankingsModule.GetRankingsSnapshotAsync(season, week);
        var summariesTask = _rankingsModule.GetRankingsSnapshotsAsync();
        await Task.WhenAll(rankingsTask, summariesTask).ConfigureAwait(false);

        var rankings = rankingsTask.Result;
        if (rankings is null)
            return null;

        var summary = summariesTask.Result.FirstOrDefault(s => s.Season == season && s.Week == week);

        return new GetRankingsSnapshotResult
        {
            IsPublished = summary?.IsPublished ?? false,
            Rankings = rankings
        };
    }

    public async Task<IEnumerable<RankingsSnapshotSummary>> GetRankingsSnapshotsAsync()
    {
        return await _rankingsModule.GetRankingsSnapshotsAsync().ConfigureAwait(false);
    }

    public async Task<GradePredictionsResult?> GradePredictionsAsync(int season, int week)
    {
        var refreshResult = await _cacheRefresher.RefreshGameResultsAsync(season).ConfigureAwait(false);
        _logger.LogInformation(
            "Refreshed {RefreshedCount} cached game result entries for season {Season} before grading ({FailedCount} kept their last cached data)",
            refreshResult.RefreshedCount, season, refreshResult.FailedCount);

        var result = await _predictionGradingModule.GradeAsync(season, week).ConfigureAwait(false);
        if (result is null)
            return null;

        result.ResultsPublished = await _predictionsModule.AreResultsPublishedAsync(season, week).ConfigureAwait(false);

        if (result.IsPersisted && result.ResultsPublished)
        {
            await _teamPredictionRecordModule.InvalidateCacheAsync().ConfigureAwait(false);
            await _trackRecordModule.InvalidateCacheAsync().ConfigureAwait(false);
            _logger.LogInformation("Re-graded published results for season {Season}, week {Week} are now live", season, week);
        }

        return result;
    }

    public async Task<NewPredictionGamesPreview> PreviewNewPredictionGamesAsync(int season, int week)
    {
        _logger.LogInformation("Checking for new games for predictions in season {Season}, week {Week}", season, week);

        var (outcome, stored, newGames) = await FindNewScheduledGamesAsync(season, week, refreshCache: true).ConfigureAwait(false);
        if (outcome != NewPredictionGamesOutcome.Success || stored is null || newGames.Count == 0)
            return new NewPredictionGamesPreview { Outcome = outcome };

        // Season data built one week past the last regular week includes the completed postseason games.
        // CFBD API serves all postseason betting lines under week 1.
        var seasonDataTask = _dataService.GetSeasonDataAsync(season, week + 1);
        var bettingLinesTask = _dataService.GetBettingLinesAsync(season, 1);
        await Task.WhenAll(seasonDataTask, bettingLinesTask).ConfigureAwait(false);

        var seasonData = seasonDataTask.Result;
        var ratings = await _ratingAlgorithmResolver.ResolveForPredictions().RateTeamsAsync(seasonData).ConfigureAwait(false);

        IReadOnlyDictionary<string, double> storedCalibration = stored.AppliedCalibration ?? new Dictionary<string, double>();
        var (predictions, _) = await GeneratePredictionsWithCalibrationAsync(
            _predictionAlgorithmResolver.ResolveForSeason(season), _ => Task.FromResult(storedCalibration),
            seasonData, ratings, newGames, bettingLinesTask.Result).ConfigureAwait(false);

        var predictionsByKey = predictions
            .GroupBy(p => PredictionGrader.BuildMatchKey(p.HomeTeam, p.AwayTeam))
            .ToDictionary(g => g.Key, g => g.First());
        var games = new List<GamePrediction>();
        var waitingOnLines = new List<ScheduleGame>();

        foreach (var game in newGames)
        {
            if (!predictionsByKey.TryGetValue(PredictionGrader.BuildMatchKey(game.HomeTeam!, game.AwayTeam!), out var prediction))
            {
                _logger.LogWarning("No prediction generated for new game {AwayTeam} at {HomeTeam}", game.AwayTeam, game.HomeTeam);
                continue;
            }

            if (prediction.BettingSpread.HasValue)
                games.Add(prediction);
            else
                waitingOnLines.Add(game);
        }

        _logger.LogInformation(
            "Found {GameCount} new games with lines and {WaitingCount} waiting on lines for season {Season}, week {Week}",
            games.Count, waitingOnLines.Count, season, week);

        return new NewPredictionGamesPreview { Games = games, Outcome = NewPredictionGamesOutcome.Success, WaitingOnLines = waitingOnLines };
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

    public async Task<PublishRankingsOutcome> PublishRankingsSnapshotAsync(int season, int week)
    {
        _logger.LogInformation("Publishing rankings snapshot for season {Season}, week {Week}", season, week);

        var calendarTask = _dataService.GetCalendarAsync(season);
        var fullScheduleTask = _dataService.GetFullSeasonScheduleAsync(season);
        await Task.WhenAll(calendarTask, fullScheduleTask).ConfigureAwait(false);

        var calendarWeek = (await calendarTask).FirstOrDefault(w => w.Week == week);
        var fullSchedule = await fullScheduleTask;
        var seasonType = calendarWeek?.SeasonType ?? string.Empty;

        if (!_seasonModule.IsWeekComplete(week, seasonType, fullSchedule))
        {
            _logger.LogWarning(
                "Refused to publish rankings snapshot for season {Season}, week {Week}: week is not yet complete",
                season, week);
            return PublishRankingsOutcome.WeekIncomplete;
        }

        var result = await _rankingsModule.PublishRankingsSnapshotAsync(season, week).ConfigureAwait(false);

        if (!result)
            return PublishRankingsOutcome.NotFound;

        await _pollLeadersModule.InvalidateCacheAsync().ConfigureAwait(false);
        await _seasonTrendsModule.InvalidateCacheAsync().ConfigureAwait(false);

        return PublishRankingsOutcome.Published;
    }

    public async Task<CacheRefreshResult> RefreshSeasonCacheAsync(int season, int week)
    {
        _logger.LogInformation("Refreshing cached CFBD data for season {Season}, week {Week}", season, week);

        var result = await _cacheRefresher.RefreshSeasonScopedAsync(season, week).ConfigureAwait(false);

        _logger.LogInformation("Refreshed {RefreshedCount} cached entries for season {Season}, week {Week}", result.RefreshedCount, season, week);
        if (result.FailedCount > 0)
        {
            _logger.LogWarning(
                "{FailedCount} cached entries for season {Season}, week {Week} could not be refreshed; the last cached data is used for them",
                result.FailedCount, season, week);
        }

        return result;
    }

    public async Task<int> RemoveCacheEntriesAsync(IEnumerable<string> keys)
    {
        return await _cache.RemoveManyAsync(keys).ConfigureAwait(false);
    }

    public async Task<bool> RemoveCacheEntryAsync(string key)
    {
        return await _cache.RemoveAsync(key).ConfigureAwait(false);
    }

    public async Task<SavePredictionCalibrationResult> SavePredictionCalibrationAsync(int season, int week, IReadOnlyDictionary<string, double> values, PredictionCalibrationSource source)
    {
        ArgumentNullException.ThrowIfNull(values);

        if (source == PredictionCalibrationSource.CarriedForward)
            throw new ArgumentException("Carried-forward values are saved only when predictions are generated.", nameof(source));

        if (_predictionAlgorithmResolver.ResolveForSeason(season) is not ICalibratedPredictionCalculator calibratedCalculator)
            return new SavePredictionCalibrationResult { Outcome = SavePredictionCalibrationOutcome.NotSupported };

        var publishedWeeks = await _predictionsModule.GetPublishedWeekNumbersAsync(season).ConfigureAwait(false);
        if (publishedWeeks.Contains(week))
            return new SavePredictionCalibrationResult { Outcome = SavePredictionCalibrationOutcome.Locked };

        var validationError = ValidateCalibrationValues(values, calibratedCalculator.CalibrationParameters);
        if (validationError is not null)
            return new SavePredictionCalibrationResult { ErrorMessage = validationError, Outcome = SavePredictionCalibrationOutcome.InvalidValues };

        var savedValues = values.ToDictionary(v => v.Key, v => v.Value);
        await _predictionCalibrationModule.SaveAsync(new PredictionCalibration
        {
            Season = season,
            Source = source,
            Values = savedValues,
            Week = week
        }).ConfigureAwait(false);

        _logger.LogInformation("Saved prediction calibration for season {Season}, week {Week} ({Source})", season, week, source);

        await RefreshLaterCarriedForwardRowsAsync(season, week, savedValues, publishedWeeks).ConfigureAwait(false);

        return new SavePredictionCalibrationResult { Outcome = SavePredictionCalibrationOutcome.Saved };
    }

    /// <summary>
    /// The values each of the season's earlier prediction weeks was generated with: its saved snapshot's
    /// applied values (the defaults for a snapshot generated before calibration existed), or the values that
    /// would apply to it now when it has no snapshot.
    /// </summary>
    private async Task<IReadOnlyDictionary<int, IReadOnlyDictionary<string, double>>> BuildAppliedCalibrationByWeekAsync(int season, int week, IEnumerable<PredictionsResult> snapshots, IReadOnlyList<PredictionCalibrationParameter> parameters)
    {
        var snapshotsByWeek = snapshots.ToDictionary(s => s.Week);
        var defaults = PredictionCalibrationValues.Defaults(parameters);
        var appliedByWeek = new Dictionary<int, IReadOnlyDictionary<string, double>>();

        for (var predictionWeek = 1; predictionWeek < week; predictionWeek++)
        {
            appliedByWeek[predictionWeek] = snapshotsByWeek.TryGetValue(predictionWeek, out var snapshot)
                ? snapshot.AppliedCalibration ?? defaults
                : (await _predictionCalibrationModule.ResolveEffectiveAsync(season, predictionWeek, parameters).ConfigureAwait(false)).Values;
        }

        return appliedByWeek;
    }

    /// <summary>
    /// Opening lines for this season's completed regular-season games and the two prior seasons'. This season's
    /// come from saved prediction snapshots where available, so they match what was graded and cost no API
    /// calls; other weeks come from cached betting lines, which never expire once a season is over.
    /// </summary>
    private async Task<IReadOnlyList<HistoricalGameLine>> BuildCalibrationLineHistoryAsync(int season, int week, IEnumerable<PredictionsResult> snapshots, IEnumerable<ScheduleGame> fullSchedule)
    {
        var scheduleList = fullSchedule.ToList();
        var lines = new List<HistoricalGameLine>();
        var scoic = StringComparison.OrdinalIgnoreCase;
        var coveredGameWeeks = new HashSet<int>();

        foreach (var snapshot in snapshots)
        {
            var (gameWeek, isPostseason) = GameWeekResolver.Resolve(snapshot.Week, scheduleList);
            if (isPostseason)
                continue;

            coveredGameWeeks.Add(gameWeek);
            lines.AddRange(snapshot.Predictions
                .Where(p => p.BettingSpread.HasValue || p.BettingOverUnder.HasValue)
                .Select(p => new HistoricalGameLine
                {
                    AwayTeam = p.AwayTeam,
                    GameWeek = gameWeek,
                    HomeTeam = p.HomeTeam,
                    OverUnder = p.BettingOverUnder,
                    Season = season,
                    Spread = p.BettingSpread
                }));
        }

        var (targetGameWeek, targetIsPostseason) = GameWeekResolver.Resolve(week, scheduleList);
        var lastCompletedGameWeek = targetIsPostseason ? GameWeekResolver.GetMaxRegularWeek(scheduleList) : targetGameWeek - 1;

        var weeksToFetch = Enumerable.Range(1, Math.Max(0, lastCompletedGameWeek))
            .Where(w => !coveredGameWeeks.Contains(w))
            .Select(w => (Season: season, GameWeek: w))
            .ToList();

        var priorCalendars = await Task.WhenAll(new[] { season - 2, season - 1 }.Select(async s => (Season: s, Calendar: await _dataService.GetCalendarAsync(s).ConfigureAwait(false)))).ConfigureAwait(false);
        weeksToFetch.AddRange(priorCalendars.SelectMany(c => c.Calendar
            .Where(w => w.SeasonType is not null && w.SeasonType.Equals("regular", scoic))
            .Select(w => (c.Season, GameWeek: w.Week))));

        using var throttle = new SemaphoreSlim(MAX_CONCURRENT_LINE_FETCHES);
        var fetched = await Task.WhenAll(weeksToFetch.Select(async w => (w.Season, w.GameWeek, Lines: await FetchThrottledBettingLinesAsync(w.Season, w.GameWeek, throttle).ConfigureAwait(false)))).ConfigureAwait(false);
        lines.AddRange(fetched.SelectMany(f => f.Lines.Select(l => new HistoricalGameLine
        {
            AwayTeam = l.AwayTeam,
            GameID = l.GameID,
            GameWeek = f.GameWeek,
            HomeTeam = l.HomeTeam,
            OverUnder = l.OverUnderOpen,
            Season = f.Season,
            Spread = l.SpreadOpen
        })));

        return lines;
    }

    private async Task<ExperimentalPredictionsResult> CalculateThrottledExperimentalPredictionsAsync(
        int season, int week, RatingAlgorithmVersion algorithmVersion, SemaphoreSlim throttle)
    {
        await throttle.WaitAsync().ConfigureAwait(false);
        try
        {
            return await CalculateExperimentalPredictionsAsync(season, week, algorithmVersion).ConfigureAwait(false);
        }
        finally
        {
            throttle.Release();
        }
    }

    private async Task<IEnumerable<BettingLine>> FetchThrottledBettingLinesAsync(int season, int week, SemaphoreSlim throttle)
    {
        await throttle.WaitAsync().ConfigureAwait(false);
        try
        {
            return await _dataService.GetBettingLinesAsync(season, week).ConfigureAwait(false);
        }
        finally
        {
            throttle.Release();
        }
    }

    /// <summary>
    /// Finds the scheduled game in the resolved game week (or postseason) that exactly matches the requested
    /// home team, away team, and neutral-site flag, whether or not it has been played yet.
    /// </summary>
    private ScheduleGame? FindExactScheduledGame(
        IEnumerable<ScheduleGame> fullSchedule, string homeTeam, string awayTeam, bool neutralSite, int gameWeek, bool isPostseason)
    {
        var scoic = StringComparison.OrdinalIgnoreCase;

        return fullSchedule.FirstOrDefault(g =>
            g.HomeTeam is not null && g.HomeTeam.Equals(homeTeam, scoic)
            && g.AwayTeam is not null && g.AwayTeam.Equals(awayTeam, scoic)
            && g.NeutralSite == neutralSite
            && (isPostseason
                ? g.SeasonType is not null && g.SeasonType.Equals("postseason", scoic)
                : g.Week == gameWeek && (g.SeasonType is null || g.SeasonType.Equals("regular", scoic))));
    }

    /// <summary>
    /// Finds the postseason FBS games scheduled since the week's predictions were saved that haven't kicked off,
    /// ordered by kickoff, along with the stored predictions. <paramref name="refreshCache"/> re-fetches the
    /// postseason cache entries first, swapping each cached copy only once its fresh data is in hand.
    /// </summary>
    private async Task<(NewPredictionGamesOutcome Outcome, PredictionsResult? Stored, IReadOnlyList<ScheduleGame> NewGames)> FindNewScheduledGamesAsync(int season, int week, bool refreshCache)
    {
        var stored = await _predictionsModule.GetAsync(season, week).ConfigureAwait(false);
        if (stored is null)
            return (NewPredictionGamesOutcome.NotFound, null, []);

        var fullSchedule = (await _dataService.GetFullSeasonScheduleAsync(season).ConfigureAwait(false)).ToList();
        if (!IsPostseasonWeek(week, fullSchedule))
            return (NewPredictionGamesOutcome.NotPostseason, stored, []);

        if (refreshCache)
        {
            var refreshResult = await _cacheRefresher.RefreshPostseasonAsync(season).ConfigureAwait(false);
            _logger.LogInformation(
                "Refreshed {RefreshedCount} cached postseason entries for season {Season} ({FailedCount} kept their last cached data)",
                refreshResult.RefreshedCount, season, refreshResult.FailedCount);

            fullSchedule = (await _dataService.GetFullSeasonScheduleAsync(season).ConfigureAwait(false)).ToList();
        }

        var fbsTeamNames = (await _dataService.GetFBSTeamsAsync(season).ConfigureAwait(false))
            .Select(t => t.Name)
            .Where(n => !string.IsNullOrEmpty(n))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var existingKeys = stored.Predictions
            .SelectMany(p => new[] { PredictionGrader.BuildMatchKey(p.HomeTeam, p.AwayTeam), PredictionGrader.BuildMatchKey(p.AwayTeam, p.HomeTeam) })
            .ToHashSet();
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var (gameWeek, isPostseason) = GameWeekResolver.Resolve(week, fullSchedule);

        var newGames = SelectWeekGames(fullSchedule, fbsTeamNames, gameWeek, isPostseason)
            .Where(g => !g.Completed && (!g.StartDate.HasValue || g.StartDate.Value > now))
            .Where(g => !existingKeys.Contains(PredictionGrader.BuildMatchKey(g.HomeTeam!, g.AwayTeam!)))
            .OrderBy(g => g.StartDate ?? DateTime.MaxValue)
            .ToList();

        return (NewPredictionGamesOutcome.Success, stored, newGames);
    }

    /// <summary>
    /// Finds every completed game between the two teams across the season, in either home/away orientation,
    /// ordered regular season by week then postseason. Opening lines are fetched only for weeks with a meeting.
    /// Games played after the predicted game week are flagged, since the model could not have seen them.
    /// </summary>
    private async Task<IReadOnlyList<MatchupActualGame>> FindSeasonMeetingsAsync(
        int season, IEnumerable<ScheduleGame> fullSchedule, string homeTeam, string awayTeam, int gameWeek, bool isPostseason)
    {
        var scoic = StringComparison.OrdinalIgnoreCase;
        var matchKeys = new HashSet<string>
        {
            PredictionGrader.BuildMatchKey(homeTeam, awayTeam),
            PredictionGrader.BuildMatchKey(awayTeam, homeTeam)
        };

        var meetings = fullSchedule
            .Where(g => g.HomeTeam is not null && g.AwayTeam is not null
                && g.HomePoints.HasValue && g.AwayPoints.HasValue
                && matchKeys.Contains(PredictionGrader.BuildMatchKey(g.HomeTeam, g.AwayTeam)))
            .Select(g => (Game: g, IsPostseason: g.SeasonType is not null && g.SeasonType.Equals("postseason", scoic)))
            .OrderBy(m => m.IsPostseason)
            .ThenBy(m => m.Game.Week ?? 0)
            .ThenBy(m => m.Game.StartDate ?? DateTime.MaxValue)
            .ToList();

        if (meetings.Count == 0)
            return [];

        // CFBD API serves all postseason betting lines under week 1
        var lineWeeks = meetings
            .Select(m => m.IsPostseason ? 1 : m.Game.Week ?? 0)
            .Where(w => w > 0)
            .Distinct()
            .ToList();
        var lineResults = await Task.WhenAll(lineWeeks.Select(w => _dataService.GetBettingLinesAsync(season, w))).ConfigureAwait(false);
        var linesByGameID = lineResults
            .SelectMany(lines => lines)
            .Where(b => b.GameID.HasValue)
            .GroupBy(b => b.GameID!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        return meetings
            .Select(m =>
            {
                var line = m.Game.GameID.HasValue && linesByGameID.TryGetValue(m.Game.GameID.Value, out var match) ? match : null;

                return new MatchupActualGame
                {
                    AwayPoints = m.Game.AwayPoints!.Value,
                    AwayTeam = m.Game.AwayTeam!,
                    BettingOverUnder = line?.OverUnderOpen,
                    BettingSpread = line?.SpreadOpen,
                    HomePoints = m.Game.HomePoints!.Value,
                    HomeTeam = m.Game.HomeTeam!,
                    NeutralSite = m.Game.NeutralSite,
                    PlayedAfterPrediction = !isPostseason && (m.IsPostseason || m.Game.Week > gameWeek),
                    SeasonType = m.IsPostseason ? "postseason" : "regular",
                    Week = m.Game.Week
                };
            })
            .ToList();
    }

    /// <summary>
    /// Generates experimental predictions with the requested algorithm version. A calibrated calculator gets the
    /// week's effective calibration values, which are returned with the predictions; nothing is saved, so a week
    /// with no stored values uses the carried-forward values without recording them.
    /// </summary>
    private async Task<(IEnumerable<GamePrediction> Predictions, IReadOnlyDictionary<string, double>? AppliedCalibration)> GenerateExperimentalPredictionsAsync(RatingAlgorithmVersion algorithmVersion, int season, int week, SeasonData seasonData, IDictionary<string, RatingDetails> ratings, IEnumerable<ScheduleGame> games, IEnumerable<BettingLine> bettingLines)
    {
        return await GeneratePredictionsWithCalibrationAsync(_predictionAlgorithmResolver.Resolve(algorithmVersion), async parameters => (await _predictionCalibrationModule.ResolveEffectiveAsync(season, week, parameters).ConfigureAwait(false)).Values, seasonData, ratings, games, bettingLines)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Generates predictions with the given calculator. A calibrated calculator gets the values returned by
    /// <paramref name="resolveCalibration"/>, which are returned with the predictions; any other calculator
    /// generates without calibration and returns null for them.
    /// </summary>
    private async Task<(IEnumerable<GamePrediction> Predictions, IReadOnlyDictionary<string, double>? AppliedCalibration)> GeneratePredictionsWithCalibrationAsync(IPredictionCalculatorModule calculator, Func<IReadOnlyList<PredictionCalibrationParameter>, Task<IReadOnlyDictionary<string, double>>> resolveCalibration, SeasonData seasonData, IDictionary<string, RatingDetails> ratings, IEnumerable<ScheduleGame> games, IEnumerable<BettingLine> bettingLines)
    {
        if (calculator is not ICalibratedPredictionCalculator calibratedCalculator)
            return (await calculator.GeneratePredictionsAsync(seasonData, ratings, games, bettingLines).ConfigureAwait(false), null);

        var calibration = await resolveCalibration(calibratedCalculator.CalibrationParameters).ConfigureAwait(false);
        var predictions = await calibratedCalculator.GeneratePredictionsAsync(seasonData, ratings, games, bettingLines, calibration).ConfigureAwait(false);
        return (predictions, calibration);
    }

    /// <summary>
    /// Compares two sets of calibration values over the given parameters. A null or missing value counts
    /// as the parameter's default, so a draft generated before calibration existed matches the defaults.
    /// </summary>
    private bool HaveSameCalibrationValues(IReadOnlyDictionary<string, double>? applied, IReadOnlyDictionary<string, double> current, IEnumerable<PredictionCalibrationParameter> parameters)
    {
        const double tolerance = 1e-9;

        var parameterList = parameters.ToList();
        var appliedValues = PredictionCalibrationValues.Normalize(applied ?? new Dictionary<string, double>(), parameterList);
        var currentValues = PredictionCalibrationValues.Normalize(current, parameterList);

        return parameterList.All(p => Math.Abs(appliedValues[p.Key] - currentValues[p.Key]) < tolerance);
    }

    /// <summary>
    /// Whether the week's games are postseason games. False when the schedule has no regular-season games, so a
    /// missing schedule never reads as postseason.
    /// </summary>
    private bool IsPostseasonWeek(int week, IEnumerable<ScheduleGame> fullSchedule)
    {
        var schedule = fullSchedule.ToList();

        return GameWeekResolver.GetMaxRegularWeek(schedule) > 0 && GameWeekResolver.Resolve(week, schedule).IsPostseason;
    }

    /// <summary>
    /// After a week's values are saved, points the season's later carried-forward rows at that week and gives
    /// them its values, so they don't keep values carried from before the change. Stops at the first later
    /// week that set its own values or is published (its row records what the published predictions used).
    /// A later week whose draft was generated with the old values then reports the mismatch.
    /// </summary>
    private async Task RefreshLaterCarriedForwardRowsAsync(int season, int week, IReadOnlyDictionary<string, double> values, IEnumerable<int> publishedWeeks)
    {
        var published = publishedWeeks.ToHashSet();
        var laterRows = (await _predictionCalibrationModule.GetSeasonAsync(season).ConfigureAwait(false))
            .Where(c => c.Week > week)
            .OrderBy(c => c.Week);

        foreach (var row in laterRows)
        {
            if (row.Source != PredictionCalibrationSource.CarriedForward || published.Contains(row.Week))
                break;

            await _predictionCalibrationModule.SaveAsync(new PredictionCalibration
            {
                CarriedFromSeason = season,
                CarriedFromWeek = week,
                Season = season,
                Source = PredictionCalibrationSource.CarriedForward,
                Values = values,
                Week = row.Week
            }).ConfigureAwait(false);

            _logger.LogInformation("Updated carried-forward prediction calibration for season {Season}, week {Week} from week {OriginWeek}", season, row.Week, week);
        }
    }

    /// <summary>
    /// Returns the calibration values to calculate a week's predictions with. A week with no stored values
    /// gets the carried-forward values saved as its own row, so its history shows what was applied.
    /// </summary>
    private async Task<IReadOnlyDictionary<string, double>> ResolveCalibrationForCalculationAsync(int season, int week, IEnumerable<PredictionCalibrationParameter> parameters)
    {
        var parameterList = parameters.ToList();

        var stored = await _predictionCalibrationModule.GetAsync(season, week, parameterList).ConfigureAwait(false);
        if (stored is not null)
            return stored.Values;

        var carriedForward = await _predictionCalibrationModule.ResolveCarriedForwardAsync(season, week, parameterList).ConfigureAwait(false);

        try
        {
            // Never replaces a row: values saved for the week while this calculation ran win, and the week then
            // reports that its draft used different values.
            if (await _predictionCalibrationModule.SaveIfMissingAsync(carriedForward).ConfigureAwait(false))
                _logger.LogInformation("Saved carried-forward prediction calibration for season {Season}, week {Week}", season, week);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to persist carried-forward prediction calibration for season {Season}, week {Week}", season, week);
        }

        return carriedForward.Values;
    }

    /// <summary>
    /// The week's FBS-vs-FBS games: every postseason game for a postseason week, otherwise the games in
    /// <paramref name="gameWeek"/>.
    /// </summary>
    private IReadOnlyList<ScheduleGame> SelectWeekGames(IEnumerable<ScheduleGame> fullSchedule, ISet<string> fbsTeamNames, int gameWeek, bool isPostseason)
    {
        var scoic = StringComparison.OrdinalIgnoreCase;

        return fullSchedule
            .Where(g => g.HomeTeam is not null && fbsTeamNames.Contains(g.HomeTeam)
                && g.AwayTeam is not null && fbsTeamNames.Contains(g.AwayTeam)
                && (isPostseason
                    ? g.SeasonType is not null && g.SeasonType.Equals("postseason", scoic)
                    : g.Week == gameWeek))
            .ToList();
    }

    /// <summary>
    /// Checks submitted calibration values against the algorithm's parameters: every parameter must have a
    /// finite value within its range, and no other keys are allowed.
    /// </summary>
    /// <returns>A message describing the first problem found, or null when the values are valid.</returns>
    private string? ValidateCalibrationValues(IReadOnlyDictionary<string, double> values, IReadOnlyList<PredictionCalibrationParameter> parameters)
    {
        var unknownKey = values.Keys.FirstOrDefault(k => parameters.All(p => p.Key != k));
        if (unknownKey is not null)
            return $"Unknown calibration parameter: {unknownKey}";

        foreach (var parameter in parameters)
        {
            if (!values.TryGetValue(parameter.Key, out var value))
                return $"A value for {parameter.Label} is required";

            if (!double.IsFinite(value) || value < parameter.Min || value > parameter.Max)
                return $"{parameter.Label} must be between {parameter.Min} and {parameter.Max}";
        }

        return null;
    }
}
