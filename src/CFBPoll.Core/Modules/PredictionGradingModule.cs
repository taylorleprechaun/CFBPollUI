using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Modules;

public class PredictionGradingModule : IPredictionGradingModule
{
    private readonly ICFBDataService _dataService;
    private readonly ILogger<PredictionGradingModule> _logger;
    private readonly IPredictionsModule _predictionsModule;

    public PredictionGradingModule(ICFBDataService dataService, ILogger<PredictionGradingModule> logger, IPredictionsModule predictionsModule)
    {
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _predictionsModule = predictionsModule ?? throw new ArgumentNullException(nameof(predictionsModule));
    }

    public async Task<GradePredictionsResult?> GradeAsync(int season, int week)
    {
        _logger.LogInformation("Grading predictions for season {Season}, week {Week}", season, week);

        var stored = await _predictionsModule.GetAsync(season, week).ConfigureAwait(false);
        if (stored is null)
            return null;

        var fullSchedule = await _dataService.GetFullSeasonScheduleAsync(season).ConfigureAwait(false);
        var (gameWeek, isPostseason) = GameWeekResolver.Resolve(week, fullSchedule);

        var completedGames = await _dataService
            .GetGamesAsync(season, isPostseason ? "postseason" : "regular")
            .ConfigureAwait(false);

        if (!isPostseason)
            completedGames = completedGames.Where(g => g.Week == gameWeek);

        var resultsByGame = completedGames
            .Where(g => g.HomeTeam is not null && g.AwayTeam is not null && g.HomePoints.HasValue && g.AwayPoints.HasValue)
            .GroupBy(g => PredictionGrader.BuildMatchKey(g.HomeTeam!, g.AwayTeam!))
            .ToDictionary(g => g.Key, g => g.First());

        var unmatchedCount = 0;

        foreach (var prediction in stored.Predictions)
        {
            if (!resultsByGame.TryGetValue(PredictionGrader.BuildMatchKey(prediction.HomeTeam, prediction.AwayTeam), out var game))
            {
                unmatchedCount++;
                continue;
            }

            PredictionGrader.Grade(prediction, game.HomePoints!.Value, game.AwayPoints!.Value);
        }

        var gradedResult = new PredictionsResult
        {
            Season = stored.Season,
            Week = stored.Week,
            Predictions = stored.Predictions
        };

        var persisted = true;
        try
        {
            persisted = await _predictionsModule.SaveGradedResultAsync(gradedResult).ConfigureAwait(false);
            if (persisted)
                _logger.LogInformation("Saved graded results for season {Season}, week {Week}", season, week);
            else
                _logger.LogWarning("No matching predictions row found to save graded results for season {Season}, week {Week}", season, week);
        }
        catch (Exception ex)
        {
            persisted = false;
            _logger.LogWarning(ex, "Failed to persist graded results for season {Season}, week {Week}", season, week);
        }

        if (unmatchedCount > 0)
        {
            _logger.LogWarning(
                "Graded predictions for season {Season}, week {Week} had {UnmatchedCount} unmatched games",
                season, week, unmatchedCount);
        }

        _logger.LogInformation(
            "Graded {GameCount} games for season {Season}, week {Week}, {UnmatchedCount} unmatched",
            stored.Predictions.Count, season, week, unmatchedCount);

        return new GradePredictionsResult
        {
            IsPersisted = persisted,
            Predictions = gradedResult,
            UnmatchedGameCount = unmatchedCount
        };
    }
}
