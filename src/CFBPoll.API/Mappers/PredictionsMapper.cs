using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class PredictionsMapper
{
    public static GamePredictionDTO ToDTO(GamePrediction prediction)
    {
        ArgumentNullException.ThrowIfNull(prediction);

        return new GamePredictionDTO
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

    public static PredictionsResponseDTO ToResponseDTO(PredictionsResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new PredictionsResponseDTO
        {
            Predictions = result.Predictions.Select(ToDTO),
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
            IsPublished = summary.IsPublished,
            Season = summary.Season,
            Week = summary.Week
        };
    }
}
