namespace CFBPoll.Core.Caching;

/// <summary>
/// Provides persistent caching with storage that survives application restarts.
/// </summary>
public interface IPersistentCache
{
    /// <summary>
    /// Retrieves a cached item by key.
    /// </summary>
    /// <typeparam name="T">The type of cached data.</typeparam>
    /// <param name="key">The cache key.</param>
    /// <returns>The cached data if found and not expired; otherwise null.</returns>
    Task<T?> GetAsync<T>(string key) where T : class;

    /// <summary>
    /// Stores an item in the cache with the specified expiration.
    /// </summary>
    /// <typeparam name="T">The type of data to cache.</typeparam>
    /// <param name="key">The cache key.</param>
    /// <param name="data">The data to cache.</param>
    /// <param name="expiresAt">When the cache entry should expire.</param>
    /// <returns>True if the item was cached successfully; otherwise false.</returns>
    Task<bool> SetAsync<T>(string key, T data, DateTime expiresAt) where T : class;

    /// <summary>
    /// Removes a cached item by key.
    /// </summary>
    /// <param name="key">The cache key to remove.</param>
    /// <returns>True if the item was removed; otherwise false.</returns>
    Task<bool> RemoveAsync(string key);

    /// <summary>
    /// Removes all expired cache entries from storage.
    /// </summary>
    /// <returns>The number of expired entries that were removed.</returns>
    Task<int> CleanupExpiredAsync();
}
