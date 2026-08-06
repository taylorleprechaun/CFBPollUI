using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class TeamPredictionRecordMapper
{
    public static TeamPredictionRecordDTO ToDTO(TeamPredictionRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return new TeamPredictionRecordDTO
        {
            ActualLosses = record.ActualLosses,
            ActualWins = record.ActualWins,
            GradedGameCount = record.GradedGameCount,
            LogoURL = record.LogoURL,
            PredictedLosses = record.PredictedLosses,
            PredictedWins = record.PredictedWins,
            TeamName = record.TeamName
        };
    }

    public static TeamPredictionRecordsResponseDTO ToResponseDTO(int season, IEnumerable<TeamPredictionRecord> records)
    {
        ArgumentNullException.ThrowIfNull(records);

        return new TeamPredictionRecordsResponseDTO
        {
            Records = records.Select(ToDTO),
            Season = season
        };
    }
}
