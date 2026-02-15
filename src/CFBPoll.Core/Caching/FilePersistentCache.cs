using System.Text.Json;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Caching;

public partial class FilePersistentCache : IPersistentCache, IDisposable
{
    private readonly string _cacheDirectory;
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true
    };
    private readonly ILogger<FilePersistentCache> _logger;
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    public FilePersistentCache(IOptions<CacheOptions> options, ILogger<FilePersistentCache> logger)
    {
        if (options?.Value is null)
        {
            throw new ArgumentNullException(nameof(options));
        }

        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _cacheDirectory = options.Value.CacheDirectory;

        EnsureCacheDirectoryExists();
    }

    public async Task<int> CleanupExpiredAsync()
    {
        await _semaphore.WaitAsync().ConfigureAwait(false);
        try
        {
            var removedCount = 0;
            var files = Directory.GetFiles(_cacheDirectory, "*.json");

            foreach (var file in files)
            {
                try
                {
                    var json = await File.ReadAllTextAsync(file).ConfigureAwait(false);
                    using var document = JsonDocument.Parse(json);

                    if (document.RootElement.TryGetProperty("ExpiresAt", out var expiresAtElement))
                    {
                        var expiresAt = expiresAtElement.GetDateTime();
                        if (expiresAt < DateTime.UtcNow)
                        {
                            File.Delete(file);
                            removedCount++;
                            _logger.LogDebug("Removed expired cache file: {FileName}", Path.GetFileName(file));
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing cache file during cleanup: {FileName}", Path.GetFileName(file));
                }
            }

            _logger.LogInformation("Cache cleanup complete. Removed {Count} expired entries", removedCount);
            return removedCount;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));
        }

        await _semaphore.WaitAsync().ConfigureAwait(false);
        try
        {
            var filePath = GetFilePath(key);

            if (!File.Exists(filePath))
            {
                _logger.LogDebug("Cache miss for key: {Key}", key);
                return null;
            }

            var json = await File.ReadAllTextAsync(filePath).ConfigureAwait(false);
            var cacheEntry = JsonSerializer.Deserialize<CacheEntry<T>>(json, _jsonOptions);

            if (cacheEntry is null)
            {
                _logger.LogDebug("Cache miss for key: {Key} (null entry)", key);
                return null;
            }

            if (cacheEntry.ExpiresAt < DateTime.UtcNow)
            {
                _logger.LogDebug("Cache expired for key: {Key}", key);
                File.Delete(filePath);
                return null;
            }

            _logger.LogDebug("Cache hit for key: {Key}", key);
            return cacheEntry.Data;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading cache for key: {Key}", key);
            return null;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<bool> RemoveAsync(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));
        }

        await _semaphore.WaitAsync().ConfigureAwait(false);
        try
        {
            var filePath = GetFilePath(key);

            if (!File.Exists(filePath))
            {
                return false;
            }

            File.Delete(filePath);
            _logger.LogDebug("Removed cache entry for key: {Key}", key);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error removing cache for key: {Key}", key);
            return false;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<bool> SetAsync<T>(string key, T data, DateTime expiresAt) where T : class
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));
        }

        if (data is null)
        {
            throw new ArgumentNullException(nameof(data));
        }

        await _semaphore.WaitAsync().ConfigureAwait(false);
        try
        {
            var cacheEntry = new CacheEntry<T>
            {
                CacheKey = key,
                Data = data,
                CachedAt = DateTime.UtcNow,
                ExpiresAt = expiresAt
            };

            var json = JsonSerializer.Serialize(cacheEntry, _jsonOptions);
            var filePath = GetFilePath(key);

            await File.WriteAllTextAsync(filePath, json).ConfigureAwait(false);
            _logger.LogDebug("Cached data for key: {Key}, expires at: {ExpiresAt}", key, expiresAt);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error writing cache for key: {Key}", key);
            return false;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    private void EnsureCacheDirectoryExists()
    {
        try
        {
            if (!Directory.Exists(_cacheDirectory))
            {
                Directory.CreateDirectory(_cacheDirectory);
                _logger.LogInformation("Created cache directory: {Directory}", _cacheDirectory);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create cache directory: {Directory}", _cacheDirectory);
            throw;
        }
    }

    private string GetFilePath(string key)
    {
        var safeKey = InvalidFileNameCharsRegex().Replace(key, "_");
        return Path.Combine(_cacheDirectory, $"{safeKey}.json");
    }

    public void Dispose()
    {
        _semaphore.Dispose();
        GC.SuppressFinalize(this);
    }

    [System.Text.RegularExpressions.GeneratedRegex(@"[<>:""/\\|?*\x00-\x1F]")]
    private static partial System.Text.RegularExpressions.Regex InvalidFileNameCharsRegex();
}
