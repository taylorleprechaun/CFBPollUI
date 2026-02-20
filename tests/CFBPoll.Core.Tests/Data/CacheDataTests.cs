using CFBPoll.Core.Data;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Data;

public class CacheDataTests
{
    [Fact]
    public void Constructor_ThrowsOnNullOptions()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CacheData(null!, new Mock<ILogger<CacheData>>().Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullLogger()
    {
        var options = new Mock<IOptions<CacheOptions>>();
        options.Setup(x => x.Value).Returns(new CacheOptions());

        Assert.Throws<ArgumentNullException>(() =>
            new CacheData(options.Object, null!));
    }

    [Fact]
    public async Task InitializeAsync_CreatesTable()
    {
        var (data, tempPath) = CreateCacheDataWithFile();
        try
        {
            await data.InitializeAsync();

            await using var connection = new SqliteConnection($"Data Source={tempPath}");
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='CacheEntry'";
            var result = await command.ExecuteScalarAsync();

            Assert.Equal("CacheEntry", result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SetEntryAsync_AndGetEntryAsync_RoundTrips()
    {
        var (data, tempPath) = CreateCacheDataWithFile();
        try
        {
            await data.InitializeAsync();

            var entry = new CacheDataEntry
            {
                CacheKey = "test_key",
                CachedAt = DateTime.UtcNow,
                Data = [1, 2, 3, 4, 5],
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };

            var setResult = await data.SetEntryAsync(entry);
            Assert.True(setResult);

            var result = await data.GetEntryAsync("test_key");

            Assert.NotNull(result);
            Assert.Equal("test_key", result.CacheKey);
            Assert.Equal(entry.Data, result.Data);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetEntryAsync_ReturnsNull_WhenNotFound()
    {
        var (data, tempPath) = CreateCacheDataWithFile();
        try
        {
            await data.InitializeAsync();

            var result = await data.GetEntryAsync("nonexistent_key");

            Assert.Null(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SetEntryAsync_OverwritesExistingEntry()
    {
        var (data, tempPath) = CreateCacheDataWithFile();
        try
        {
            await data.InitializeAsync();

            var original = new CacheDataEntry
            {
                CacheKey = "test_key",
                CachedAt = DateTime.UtcNow,
                Data = [1, 2, 3],
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };
            await data.SetEntryAsync(original);

            var replacement = new CacheDataEntry
            {
                CacheKey = "test_key",
                CachedAt = DateTime.UtcNow,
                Data = [4, 5, 6],
                ExpiresAt = DateTime.UtcNow.AddHours(2)
            };
            await data.SetEntryAsync(replacement);

            var result = await data.GetEntryAsync("test_key");

            Assert.NotNull(result);
            Assert.Equal(replacement.Data, result.Data);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SetEntryAsync_ThrowsOnNullEntry()
    {
        var (data, tempPath) = CreateCacheDataWithFile();
        try
        {
            await data.InitializeAsync();
            await Assert.ThrowsAsync<ArgumentNullException>(() => data.SetEntryAsync(null!));
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task RemoveAsync_RemovesExistingEntry_ReturnsTrue()
    {
        var (data, tempPath) = CreateCacheDataWithFile();
        try
        {
            await data.InitializeAsync();

            var entry = new CacheDataEntry
            {
                CacheKey = "test_key",
                CachedAt = DateTime.UtcNow,
                Data = [1, 2, 3],
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };
            await data.SetEntryAsync(entry);

            var removed = await data.RemoveAsync("test_key");

            Assert.True(removed);

            var result = await data.GetEntryAsync("test_key");
            Assert.Null(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task RemoveAsync_NonExisting_ReturnsFalse()
    {
        var (data, tempPath) = CreateCacheDataWithFile();
        try
        {
            await data.InitializeAsync();

            var removed = await data.RemoveAsync("nonexistent_key");

            Assert.False(removed);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task DeleteExpiredAsync_DeletesExpiredEntries()
    {
        var (data, tempPath) = CreateCacheDataWithFile();
        try
        {
            await data.InitializeAsync();

            var expired = new CacheDataEntry
            {
                CacheKey = "expired_key",
                CachedAt = DateTime.UtcNow.AddHours(-2),
                Data = [1, 2, 3],
                ExpiresAt = DateTime.UtcNow.AddHours(-1)
            };
            var valid = new CacheDataEntry
            {
                CacheKey = "valid_key",
                CachedAt = DateTime.UtcNow,
                Data = [4, 5, 6],
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };
            await data.SetEntryAsync(expired);
            await data.SetEntryAsync(valid);

            var count = await data.DeleteExpiredAsync(DateTime.UtcNow);

            Assert.Equal(1, count);

            var expiredResult = await data.GetEntryAsync("expired_key");
            Assert.Null(expiredResult);

            var validResult = await data.GetEntryAsync("valid_key");
            Assert.NotNull(validResult);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task DeleteExpiredAsync_ReturnsZero_WhenNoExpiredEntries()
    {
        var (data, tempPath) = CreateCacheDataWithFile();
        try
        {
            await data.InitializeAsync();

            var valid = new CacheDataEntry
            {
                CacheKey = "valid_key",
                CachedAt = DateTime.UtcNow,
                Data = [1, 2, 3],
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };
            await data.SetEntryAsync(valid);

            var count = await data.DeleteExpiredAsync(DateTime.UtcNow);

            Assert.Equal(0, count);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task DeleteExpiredAsync_HandlesEmptyTable()
    {
        var (data, tempPath) = CreateCacheDataWithFile();
        try
        {
            await data.InitializeAsync();

            var count = await data.DeleteExpiredAsync(DateTime.UtcNow);

            Assert.Equal(0, count);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetEntryAsync_PreservesDateTimes()
    {
        var (data, tempPath) = CreateCacheDataWithFile();
        try
        {
            await data.InitializeAsync();

            var cachedAt = new DateTime(2024, 6, 15, 12, 0, 0, DateTimeKind.Utc);
            var expiresAt = new DateTime(2024, 6, 16, 12, 0, 0, DateTimeKind.Utc);

            var entry = new CacheDataEntry
            {
                CacheKey = "datetime_key",
                CachedAt = cachedAt,
                Data = [1],
                ExpiresAt = expiresAt
            };
            await data.SetEntryAsync(entry);

            var result = await data.GetEntryAsync("datetime_key");

            Assert.NotNull(result);
            Assert.Equal(cachedAt, result.CachedAt.ToUniversalTime());
            Assert.Equal(expiresAt, result.ExpiresAt.ToUniversalTime());
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    private static (CacheData data, string filePath) CreateCacheDataWithFile()
    {
        var tempPath = Path.Combine(Path.GetTempPath(), $"cfbpoll_cache_test_{Guid.NewGuid()}.db");

        var options = new Mock<IOptions<CacheOptions>>();
        options.Setup(x => x.Value).Returns(new CacheOptions
        {
            ConnectionString = $"Data Source={tempPath}"
        });

        var logger = new Mock<ILogger<CacheData>>();
        return (new CacheData(options.Object, logger.Object), tempPath);
    }

    private static void CleanupFile(string filePath)
    {
        SqliteConnection.ClearAllPools();
        try
        {
            if (File.Exists(filePath))
                File.Delete(filePath);
        }
        catch
        {
            // Best-effort cleanup
        }
    }
}
