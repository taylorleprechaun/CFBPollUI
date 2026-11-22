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
            IsPostseason = result.IsPostseason,
            IsPublished = result.IsPublished,
            Predictions = ToResponseDTO(result.Predictions, resultsPublished: result.ResultsPublished, isGraded: result.IsGraded)
        };
    }

    public static SeasonExperimentalPredictionsWeekDTO ToDTO(SeasonExperimentalPredictionsWeek week)
    {
        ArgumentNullException.ThrowIfNull(week);

        return new SeasonExperimentalPredictionsWeekDTO
        {
            AppliedCalibration = week.AppliedCalibration?.ToDictionary(v => v.Key, v => v.Value),
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

    public static MatchupActualGameDTO ToDTO(MatchupActualGame game)
    {
        ArgumentNullException.ThrowIfNull(game);

        return new MatchupActualGameDTO
        {
            AwayPoints = game.AwayPoints,
            AwayTeam = game.AwayTeam,
            BettingOverUnder = game.BettingOverUnder,
            BettingSpread = game.BettingSpread,
            HomePoints = game.HomePoints,
            HomeTeam = game.HomeTeam,
            NeutralSite = game.NeutralSite,
            PlayedAfterPrediction = game.PlayedAfterPrediction,
            SeasonType = game.SeasonType,
            Week = game.Week
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

    public static ExperimentalMatchupResponseDTO ToExperimentalMatchupResponseDTO(ExperimentalMatchupResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new ExperimentalMatchupResponseDTO
        {
            ActualGames = result.ActualGames.Select(ToDTO).ToList(),
            AlgorithmVersion = result.AlgorithmVersion.ToString(),
            AppliedCalibration = result.AppliedCalibration?.ToDictionary(v => v.Key, v => v.Value),
            Prediction = result.Prediction is null ? null : ToDTO(result.Prediction)
        };
    }

    public static ExperimentalPredictionsResponseDTO ToExperimentalResponseDTO(ExperimentalPredictionsResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new ExperimentalPredictionsResponseDTO
        {
            AlgorithmVersion = result.AlgorithmVersion.ToString(),
            AppliedCalibration = result.AppliedCalibration?.ToDictionary(v => v.Key, v => v.Value),
            Predictions = result.Predictions.Select(p => ToDTO(p)),
            Summary = ToDTO(result.Summary)
        };
    }
    /// <summary>
    /// Maps a submitted prediction back to the domain model. Result and grade fields are not mapped, so the
    /// prediction is always ungraded.
    /// </summary>
    public static GamePrediction ToGamePrediction(GamePredictionDTO prediction)
    {
        ArgumentNullException.ThrowIfNull(prediction);

        return new GamePrediction
        {
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
            PredictedMargin = prediction.PredictedMargin,
            PredictedWinner = prediction.PredictedWinner
        };
    }

    public static GradePredictionsResponseDTO ToGradeResponseDTO(GradePredictionsResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new GradePredictionsResponseDTO
        {
            IsPersisted = result.IsPersisted,
            Predictions = ToResponseDTO(result.Predictions, resultsPublished: result.ResultsPublished, isGraded: true),
            UnmatchedGameCount = result.UnmatchedGameCount
        };
    }

    public static NewPredictionGamesPreviewDTO ToNewGamesPreviewDTO(NewPredictionGamesPreview preview)
    {
        ArgumentNullException.ThrowIfNull(preview);

        return new NewPredictionGamesPreviewDTO
        {
            Games = preview.Games.Select(p => ToDTO(p, includeGradeDetails: false)),
            WaitingOnLines = preview.WaitingOnLines.Select(ToWaitingGameDTO)
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

    public static NewPredictionGameWaitingDTO ToWaitingGameDTO(ScheduleGame game)
    {
        ArgumentNullException.ThrowIfNull(game);

        return new NewPredictionGameWaitingDTO
        {
            AwayTeam = game.AwayTeam ?? string.Empty,
            HomeTeam = game.HomeTeam ?? string.Empty,
            StartDate = game.StartDate
        };
    }
}
