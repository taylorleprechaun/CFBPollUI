using CFBPoll.Core.Caching;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Determines when cache entries expire, aligning them to a fixed refresh schedule rather than a
/// sliding lifetime from when they were fetched.
/// </summary>
public interface ICacheExpirationPolicy
{
    /// <summary>
    /// Gets the expiration for a result with no data, which is kept only briefly because it may be a
    /// transient upstream failure rather than genuinely empty data.
    /// </summary>
    DateTime GetEmptyResultExpiration();

    /// <summary>
    /// Gets the expiration for an entry in the given tier: shortly after its next scheduled refresh.
    /// </summary>
    DateTime GetExpiration(CacheRefreshTier tier);

    /// <summary>
    /// Gets the next scheduled refresh time for the given tier, in UTC.
    /// </summary>
    DateTime GetNextRefreshUTC(CacheRefreshTier tier);

    /// <summary>
    /// Gets the expiration for season-scoped data: never for a concluded season, otherwise the tier's
    /// scheduled expiration.
    /// </summary>
    DateTime GetSeasonExpiration(int season, CacheRefreshTier tier);
}
