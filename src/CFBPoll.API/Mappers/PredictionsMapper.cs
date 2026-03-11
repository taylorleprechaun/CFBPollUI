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
            AwayTeam = prediction.AwayTeam,
            Confidence = prediction.Confidence,
            HomeTeam = prediction.HomeTeam,
            HomeWinProbability = prediction.HomeWinProbability,
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
