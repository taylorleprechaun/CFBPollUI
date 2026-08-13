using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class SnapshotMapper
{
    public static SnapshotDTO ToDTO(SnapshotSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);

        return new SnapshotDTO
        {
            AlgorithmVersion = summary.AlgorithmVersion.ToString(),
            CreatedAt = summary.CreatedAt,
            IsPublished = summary.IsPublished,
            Season = summary.Season,
            Week = summary.Week
        };
    }
}
