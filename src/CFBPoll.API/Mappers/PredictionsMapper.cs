using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class PredictionsMapper
{
    public static GamePredictionDTO ToDTO(GamePrediction prediction, bool includeGradeDetails = true)
    {
        ArgumentNullException.ThrowIfNull(prediction);

        return new GamePredictionDTO
        {
            ActualAwayScore = includeGradeDetails ? prediction.ActualAwayScore : null,
            ActualHomeScore = includeGradeDetails ? prediction.ActualHomeScore : null,
            ActualOverUnderResult = includeGradeDetails ? prediction.ActualOverUnderResult : null,
            ActualSpreadCoveringTeam = includeGradeDetails ? prediction.ActualSpreadCoveringTeam : null,
            ActualWinner = includeGradeDetails ? prediction.ActualWinner : null,
            AwayLogoURL = prediction.AwayLogoURL,
            AwayTeam = prediction.AwayTeam,
            AwayTeamScore = prediction.AwayTeamScore,
            BettingOverUnder = prediction.BettingOverUnder,
            BettingSpread = prediction.BettingSpread,
            HomeLogoURL = prediction.HomeLogoURL,
            HomeTeam = prediction.HomeTeam,
            HomeTeamScore = prediction.HomeTeamScore,
            MyOverUnderPick = prediction.MyOverUnderPick,
            MySpreadPick = prediction.MySpreadPick,
            NeutralSite = prediction.NeutralSite,
            OverUnderGrade = (includeGradeDetails ? prediction.OverUnderGrade : PredictionGradeStatus.Ungraded).ToString(),
            PredictedMargin = prediction.PredictedMargin,
            PredictedWinner = prediction.PredictedWinner,
            SpreadGrade = (includeGradeDetails ? prediction.SpreadGrade : PredictionGradeStatus.Ungraded).ToString(),
            WinnerGrade = (includeGradeDetails ? prediction.WinnerGrade : PredictionGradeStatus.Ungraded).ToString()
        };
    }

    public static GradePredictionsResponseDTO ToGradeResponseDTO(GradePredictionsResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new GradePredictionsResponseDTO
        {
            IsPersisted = result.IsPersisted,
            Predictions = ToResponseDTO(result.Predictions, resultsPublished: true),
            UnmatchedGameCount = result.UnmatchedGameCount
        };
    }

    public static PredictionsResponseDTO ToResponseDTO(PredictionsResult result, bool resultsPublished)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new PredictionsResponseDTO
        {
            Predictions = result.Predictions.Select(p => ToDTO(p, resultsPublished)),
            ResultsPublished = resultsPublished,
            Season = result.Season,
            Week = result.Week
        };
    }

    public static PredictionsSummaryDTO ToSummaryDTO(PredictionsSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);

        return new PredictionsSummaryDTO
        {
            CreatedAt = summary.CreatedAt,
            GameCount = summary.GameCount,
            GradedAt = summary.GradedAt,
            IsGraded = summary.IsGraded,
            IsPublished = summary.IsPublished,
            ResultsPublished = summary.ResultsPublished,
            Season = summary.Season,
            Week = summary.Week
        };
    }
}
