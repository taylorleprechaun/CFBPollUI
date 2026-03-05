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
            CreatedAt = summary.CreatedAt,
            IsPublished = summary.Published,
            Season = summary.Season,
            Week = summary.Week
        };
    }
}
