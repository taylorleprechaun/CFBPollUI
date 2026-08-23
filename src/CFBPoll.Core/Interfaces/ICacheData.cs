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
    /// Retrieves metadata (key, size, cached/expiration timestamps) for every cache entry, without
    /// loading the underlying compressed data.
    /// </summary>
    Task<IEnumerable<CacheEntryMetadata>> GetAllEntriesMetadataAsync();

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
    /// Removes all cache entries whose key starts with the given prefix.
    /// </summary>
    Task<int> RemoveByPrefixAsync(string prefix);

    /// <summary>
    /// Removes all cache entries matching any of the given keys.
    /// </summary>
    Task<int> RemoveManyAsync(IEnumerable<string> keys);

    /// <summary>
    /// Inserts or replaces a cache entry.
    /// </summary>
    Task<bool> SetEntryAsync(CacheDataEntry entry);
}
