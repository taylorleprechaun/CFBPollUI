namespace CFBPoll.Core.Models;

public class CacheEntryMetadata
{
    public DateTime CachedAt { get; set; }
    public string CacheKey { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public long SizeBytes { get; set; }
}
