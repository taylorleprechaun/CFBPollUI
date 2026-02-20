using System.IO.Compression;
using System.Text.Json;
using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Modules;

public class CacheModule : IPersistentCache
{
    private readonly ICacheData _cacheData;
    private readonly ILogger<CacheModule> _logger;

    public CacheModule(ICacheData cacheData, ILogger<CacheModule> logger)
    {
        _cacheData = cacheData ?? throw new ArgumentNullException(nameof(cacheData));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<int> CleanupExpiredAsync()
    {
        var count = await _cacheData.DeleteExpiredAsync(DateTime.UtcNow).ConfigureAwait(false);
        _logger.LogInformation("Cache cleanup complete. Removed {Count} expired entries", count);
        return count;
    }

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));
        }

        var entry = await _cacheData.GetEntryAsync(key).ConfigureAwait(false);

        if (entry is null)
        {
            _logger.LogDebug("Cache miss for key: {Key}", key);
            return null;
        }

        if (entry.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogDebug("Cache expired for key: {Key}", key);
            await _cacheData.RemoveAsync(key).ConfigureAwait(false);
            return null;
        }

        _logger.LogDebug("Cache hit for key: {Key}", key);
        return Decompress<T>(entry.Data);
    }

    public async Task<bool> RemoveAsync(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));
        }

        return await _cacheData.RemoveAsync(key).ConfigureAwait(false);
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

        var compressed = Compress(data);

        var entry = new CacheDataEntry
        {
            CachedAt = DateTime.UtcNow,
            CacheKey = key,
            Data = compressed,
            ExpiresAt = expiresAt
        };

        var result = await _cacheData.SetEntryAsync(entry).ConfigureAwait(false);
        _logger.LogDebug("Cached data for key: {Key}, expires at: {ExpiresAt}", key, expiresAt);
        return result;
    }

    private byte[] Compress<T>(T data)
    {
        var jsonBytes = JsonSerializer.SerializeToUtf8Bytes(data);

        using var output = new MemoryStream();
        using (var gzip = new GZipStream(output, CompressionLevel.Optimal))
        {
            gzip.Write(jsonBytes, 0, jsonBytes.Length);
        }

        return output.ToArray();
    }

    private T? Decompress<T>(byte[] compressed)
    {
        ArgumentNullException.ThrowIfNull(compressed);

        using var input = new MemoryStream(compressed);
        using var gzip = new GZipStream(input, CompressionMode.Decompress);
        using var output = new MemoryStream();
        gzip.CopyTo(output);
        return JsonSerializer.Deserialize<T>(output.ToArray());
    }
}
