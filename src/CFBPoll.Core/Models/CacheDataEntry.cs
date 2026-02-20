namespace CFBPoll.Core.Models;

public class CacheDataEntry
{
    public required DateTime CachedAt { get; set; }
    public required string CacheKey { get; set; }
    public required byte[] Data { get; set; }
    public required DateTime ExpiresAt { get; set; }
}
