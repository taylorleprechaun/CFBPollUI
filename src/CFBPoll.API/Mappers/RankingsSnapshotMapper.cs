using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class RankingsSnapshotMapper
{
    public static RankingsSnapshotDTO ToDTO(RankingsSnapshotSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);

        return new RankingsSnapshotDTO
        {
            AlgorithmVersion = summary.AlgorithmVersion.ToString(),
            CreatedAt = summary.CreatedAt,
            IsPublished = summary.IsPublished,
            Season = summary.Season,
            StaleScoreOverrides = summary.StaleScoreOverrides.Select(ToStaleScoreOverrideDTO),
            Week = summary.Week
        };
    }

    public static StaleScoreOverrideDTO ToStaleScoreOverrideDTO(ScoreOverrideDifference difference)
    {
        ArgumentNullException.ThrowIfNull(difference);

        return new StaleScoreOverrideDTO
        {
            AwayTeam = difference.AwayTeam,
            GameID = difference.GameID,
            HomeTeam = difference.HomeTeam,
            Kind = difference.Kind.ToString()
        };
    }
}
