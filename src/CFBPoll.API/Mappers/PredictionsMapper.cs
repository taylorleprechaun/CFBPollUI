using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class PredictionsMapper
{
    public static AdminPredictionsResponseDTO ToAdminResponseDTO(GetPredictionsResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new AdminPredictionsResponseDTO
        {
            IsPublished = result.IsPublished,
            Predictions = ToResponseDTO(result.Predictions, resultsPublished: result.ResultsPublished, isGraded: result.IsGraded)
        };
    }

    public static SeasonExperimentalPredictionsWeekDTO ToDTO(SeasonExperimentalPredictionsWeek week)
    {
        ArgumentNullException.ThrowIfNull(week);

        return new SeasonExperimentalPredictionsWeekDTO
        {
            Summary = ToDTO(week.Summary),
            Week = week.Week
        };
    }

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

    public static PredictionRecordSummaryDTO ToDTO(PredictionRecordSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);

        return new PredictionRecordSummaryDTO
        {
            GradedGameCount = summary.GradedGameCount,
            MarginBias = summary.MarginBias,
            MarginMAE = summary.MarginMAE,
            MarginRMSE = summary.MarginRMSE,
            OverUnder = TrackRecordMapper.ToDTO(summary.OverUnder),
            Spread = TrackRecordMapper.ToDTO(summary.Spread),
            Winner = TrackRecordMapper.ToDTO(summary.Winner)
        };
    }

    public static ExperimentalPredictionsResponseDTO ToExperimentalResponseDTO(ExperimentalPredictionsResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new ExperimentalPredictionsResponseDTO
        {
            AlgorithmVersion = result.AlgorithmVersion.ToString(),
            Predictions = result.Predictions.Select(p => ToDTO(p)),
            Summary = ToDTO(result.Summary)
        };
    }
    public static GradePredictionsResponseDTO ToGradeResponseDTO(GradePredictionsResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new GradePredictionsResponseDTO
        {
            IsPersisted = result.IsPersisted,
            Predictions = ToResponseDTO(result.Predictions, resultsPublished: false, isGraded: true),
            UnmatchedGameCount = result.UnmatchedGameCount
        };
    }

    public static PredictionsResponseDTO ToResponseDTO(PredictionsResult result, bool resultsPublished, bool isGraded)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new PredictionsResponseDTO
        {
            IsGraded = isGraded,
            Predictions = result.Predictions.Select(p => ToDTO(p, isGraded)),
            ResultsPublished = resultsPublished,
            Season = result.Season,
            Week = result.Week
        };
    }

    public static SeasonExperimentalPredictionsResponseDTO ToSeasonExperimentalResponseDTO(SeasonExperimentalPredictionsResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new SeasonExperimentalPredictionsResponseDTO
        {
            AlgorithmVersion = result.AlgorithmVersion.ToString(),
            OverallSummary = ToDTO(result.OverallSummary),
            Season = result.Season,
            Weeks = result.Weeks.Select(ToDTO)
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
