using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Modules;

public class PredictionGradingModule : IPredictionGradingModule
{
    private const string OVER_RESULT = "Over";
    private const string PUSH_RESULT = "Push";
    private const string UNDER_RESULT = "Under";

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
            .GroupBy(g => BuildMatchKey(g.HomeTeam!, g.AwayTeam!))
            .ToDictionary(g => g.Key, g => g.First());

        var unmatchedCount = 0;

        foreach (var prediction in stored.Predictions)
        {
            if (!resultsByGame.TryGetValue(BuildMatchKey(prediction.HomeTeam, prediction.AwayTeam), out var game))
            {
                unmatchedCount++;
                continue;
            }

            GradePrediction(prediction, game.HomePoints!.Value, game.AwayPoints!.Value);
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

    private static string BuildMatchKey(string homeTeam, string awayTeam) =>
        $"{homeTeam}|{awayTeam}".ToUpperInvariant();

    private static void GradePrediction(GamePrediction prediction, int actualHomeScore, int actualAwayScore)
    {
        var scoic = StringComparison.OrdinalIgnoreCase;

        prediction.ActualHomeScore = actualHomeScore;
        prediction.ActualAwayScore = actualAwayScore;

        if (actualHomeScore == actualAwayScore)
        {
            prediction.ActualWinner = null;
            prediction.WinnerGrade = PredictionGradeStatus.NotApplicable;
        }
        else
        {
            prediction.ActualWinner = actualHomeScore > actualAwayScore ? prediction.HomeTeam : prediction.AwayTeam;
            prediction.WinnerGrade = string.Equals(prediction.PredictedWinner, prediction.ActualWinner, scoic)
                ? PredictionGradeStatus.Correct
                : PredictionGradeStatus.Incorrect;
        }

        if (!prediction.BettingSpread.HasValue)
        {
            prediction.ActualSpreadCoveringTeam = null;
            prediction.SpreadGrade = PredictionGradeStatus.NotApplicable;
        }
        else
        {
            var homeAdjusted = actualHomeScore + prediction.BettingSpread.Value;

            prediction.ActualSpreadCoveringTeam = homeAdjusted > actualAwayScore
                ? prediction.HomeTeam
                : homeAdjusted < actualAwayScore
                    ? prediction.AwayTeam
                    : PUSH_RESULT;

            prediction.SpreadGrade = prediction.ActualSpreadCoveringTeam == PUSH_RESULT
                ? PredictionGradeStatus.Push
                : string.Equals(prediction.MySpreadPick, prediction.ActualSpreadCoveringTeam, scoic)
                    ? PredictionGradeStatus.Correct
                    : PredictionGradeStatus.Incorrect;
        }

        if (!prediction.BettingOverUnder.HasValue)
        {
            prediction.ActualOverUnderResult = null;
            prediction.OverUnderGrade = PredictionGradeStatus.NotApplicable;
        }
        else
        {
            var actualTotal = actualHomeScore + actualAwayScore;

            prediction.ActualOverUnderResult = actualTotal > prediction.BettingOverUnder.Value
                ? OVER_RESULT
                : actualTotal < prediction.BettingOverUnder.Value
                    ? UNDER_RESULT
                    : PUSH_RESULT;

            prediction.OverUnderGrade = prediction.ActualOverUnderResult == PUSH_RESULT
                ? PredictionGradeStatus.Push
                : string.Equals(prediction.MyOverUnderPick, prediction.ActualOverUnderResult, scoic)
                    ? PredictionGradeStatus.Correct
                    : PredictionGradeStatus.Incorrect;
        }
    }
}
