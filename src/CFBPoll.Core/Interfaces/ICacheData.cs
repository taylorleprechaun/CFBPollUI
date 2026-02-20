using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Data access for the persistent cache SQLite store.
/// </summary>
public interface ICacheData
{
    /// <summary>
    /// Deletes all entries whose expiration is earlier than the specified time.
    /// </summary>
    Task<int> DeleteExpiredAsync(DateTime utcNow);

    /// <summary>
    /// Retrieves a cache entry by key.
    /// </summary>
    Task<CacheDataEntry?> GetEntryAsync(string key);

    /// <summary>
    /// Creates the cache table and enables WAL mode if it does not already exist.
    /// </summary>
    Task InitializeAsync();

    /// <summary>
    /// Removes a cache entry by key.
    /// </summary>
    Task<bool> RemoveAsync(string key);

    /// <summary>
    /// Inserts or replaces a cache entry.
    /// </summary>
    Task<bool> SetEntryAsync(CacheDataEntry entry);
}
