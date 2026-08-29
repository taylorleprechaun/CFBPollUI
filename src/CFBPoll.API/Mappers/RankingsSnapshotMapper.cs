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
            Week = summary.Week
        };
    }
}
