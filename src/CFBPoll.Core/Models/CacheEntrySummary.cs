namespace CFBPoll.Core.Models;

public class CacheEntrySummary
{
    public DateTime CachedAt { get; set; }
    public string CacheKey { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string Family { get; set; } = string.Empty;
    public int? Season { get; set; }
    public long SizeBytes { get; set; }
}
