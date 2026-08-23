using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class CacheEntryMapper
{
    public static CacheEntryDTO ToDTO(CacheEntrySummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);

        return new CacheEntryDTO
        {
            CachedAt = summary.CachedAt,
            CacheKey = summary.CacheKey,
            Detail = summary.Detail,
            ExpiresAt = summary.ExpiresAt,
            Family = summary.Family,
            Season = summary.Season,
            SizeBytes = summary.SizeBytes
        };
    }
}
