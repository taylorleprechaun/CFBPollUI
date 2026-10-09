namespace CFBPoll.Core.Caching;

/// <summary>
/// How often a cache entry is refreshed: every night, or once a week, at the configured refresh time.
/// </summary>
public enum CacheRefreshTier
{
    Daily,
    Weekly
}
