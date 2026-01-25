namespace CFBPoll.Core.Caching;

public class CacheEntry<T>
{
    public required DateTime CachedAt { get; set; }
    public required string CacheKey { get; set; }
    public required T Data { get; set; }
    public required DateTime ExpiresAt { get; set; }
}
