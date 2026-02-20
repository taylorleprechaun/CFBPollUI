using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class CacheModuleTests
{
    private readonly Mock<ICacheData> _mockCacheData;
    private readonly Mock<ILogger<CacheModule>> _mockLogger;
    private readonly CacheModule _cacheModule;

    public CacheModuleTests()
    {
        _mockCacheData = new Mock<ICacheData>();
        _mockLogger = new Mock<ILogger<CacheModule>>();
        _cacheModule = new CacheModule(_mockCacheData.Object, _mockLogger.Object);
    }

    [Fact]
    public void Constructor_ThrowsOnNullCacheData()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CacheModule(null!, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullLogger()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CacheModule(_mockCacheData.Object, null!));
    }

    [Fact]
    public async Task GetAsync_ReturnsCachedData_WhenEntryExists()
    {
        var testData = new TestData { Name = "Test", Value = 42 };
        var compressed = CompressTestData(testData);

        _mockCacheData.Setup(x => x.GetEntryAsync("test_key"))
            .ReturnsAsync(new CacheDataEntry
            {
                CacheKey = "test_key",
                CachedAt = DateTime.UtcNow,
                Data = compressed,
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            });

        var result = await _cacheModule.GetAsync<TestData>("test_key");

        Assert.NotNull(result);
        Assert.Equal("Test", result.Name);
        Assert.Equal(42, result.Value);
    }

    [Fact]
    public async Task GetAsync_ReturnsNull_WhenEntryNotFound()
    {
        _mockCacheData.Setup(x => x.GetEntryAsync("missing_key"))
            .ReturnsAsync((CacheDataEntry?)null);

        var result = await _cacheModule.GetAsync<TestData>("missing_key");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAsync_ReturnsNull_AndRemovesExpiredEntry()
    {
        var testData = new TestData { Name = "Expired", Value = 1 };
        var compressed = CompressTestData(testData);

        _mockCacheData.Setup(x => x.GetEntryAsync("expired_key"))
            .ReturnsAsync(new CacheDataEntry
            {
                CacheKey = "expired_key",
                CachedAt = DateTime.UtcNow.AddHours(-2),
                Data = compressed,
                ExpiresAt = DateTime.UtcNow.AddHours(-1)
            });

        var result = await _cacheModule.GetAsync<TestData>("expired_key");

        Assert.Null(result);
        _mockCacheData.Verify(x => x.RemoveAsync("expired_key"), Times.Once);
    }

    [Fact]
    public async Task GetAsync_ThrowsOnNullKey()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cacheModule.GetAsync<TestData>(null!));
    }

    [Fact]
    public async Task GetAsync_ThrowsOnEmptyKey()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cacheModule.GetAsync<TestData>(""));
    }

    [Fact]
    public async Task GetAsync_ThrowsOnWhitespaceKey()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cacheModule.GetAsync<TestData>("   "));
    }

    [Fact]
    public async Task SetAsync_CompressesAndStoresData()
    {
        var testData = new TestData { Name = "Test", Value = 42 };

        _mockCacheData.Setup(x => x.SetEntryAsync(It.IsAny<CacheDataEntry>()))
            .ReturnsAsync(true);

        var result = await _cacheModule.SetAsync("test_key", testData, DateTime.UtcNow.AddHours(1));

        Assert.True(result);

        _mockCacheData.Verify(x => x.SetEntryAsync(It.Is<CacheDataEntry>(e =>
            e.CacheKey == "test_key" &&
            e.Data.Length > 0)), Times.Once);
    }

    [Fact]
    public async Task SetAsync_StoresGzipCompressedData()
    {
        var testData = new TestData { Name = "Test", Value = 42 };
        byte[]? capturedData = null;

        _mockCacheData.Setup(x => x.SetEntryAsync(It.IsAny<CacheDataEntry>()))
            .Callback<CacheDataEntry>(e => capturedData = e.Data)
            .ReturnsAsync(true);

        await _cacheModule.SetAsync("test_key", testData, DateTime.UtcNow.AddHours(1));

        Assert.NotNull(capturedData);
        Assert.True(capturedData.Length >= 2);
        Assert.Equal(0x1F, capturedData[0]);
        Assert.Equal(0x8B, capturedData[1]);
    }

    [Fact]
    public async Task SetAsync_ThrowsOnNullKey()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cacheModule.SetAsync("", new TestData { Name = "Test", Value = 1 }, DateTime.UtcNow.AddHours(1)));
    }

    [Fact]
    public async Task SetAsync_ThrowsOnNullData()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            _cacheModule.SetAsync<TestData>("test_key", null!, DateTime.UtcNow.AddHours(1)));
    }

    [Fact]
    public async Task RemoveAsync_DelegatesToCacheData()
    {
        _mockCacheData.Setup(x => x.RemoveAsync("test_key")).ReturnsAsync(true);

        var result = await _cacheModule.RemoveAsync("test_key");

        Assert.True(result);
        _mockCacheData.Verify(x => x.RemoveAsync("test_key"), Times.Once);
    }

    [Fact]
    public async Task RemoveAsync_ReturnsFalse_WhenKeyNotFound()
    {
        _mockCacheData.Setup(x => x.RemoveAsync("missing_key")).ReturnsAsync(false);

        var result = await _cacheModule.RemoveAsync("missing_key");

        Assert.False(result);
    }

    [Fact]
    public async Task RemoveAsync_ThrowsOnNullKey()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cacheModule.RemoveAsync(null!));
    }

    [Fact]
    public async Task RemoveAsync_ThrowsOnEmptyKey()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cacheModule.RemoveAsync(""));
    }

    [Fact]
    public async Task CleanupExpiredAsync_DelegatesToCacheData()
    {
        _mockCacheData.Setup(x => x.DeleteExpiredAsync(It.IsAny<DateTime>()))
            .ReturnsAsync(3);

        var result = await _cacheModule.CleanupExpiredAsync();

        Assert.Equal(3, result);
        _mockCacheData.Verify(x => x.DeleteExpiredAsync(It.IsAny<DateTime>()), Times.Once);
    }

    [Fact]
    public async Task GetAsync_HandlesComplexObjects()
    {
        var testData = new ComplexTestData
        {
            ID = 123,
            Items = ["item1", "item2", "item3"],
            Nested = new TestData { Name = "Nested", Value = 456 }
        };
        var compressed = CompressTestData(testData);

        _mockCacheData.Setup(x => x.GetEntryAsync("complex_key"))
            .ReturnsAsync(new CacheDataEntry
            {
                CacheKey = "complex_key",
                CachedAt = DateTime.UtcNow,
                Data = compressed,
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            });

        var result = await _cacheModule.GetAsync<ComplexTestData>("complex_key");

        Assert.NotNull(result);
        Assert.Equal(123, result.ID);
        Assert.Equal(3, result.Items.Count);
        Assert.NotNull(result.Nested);
        Assert.Equal("Nested", result.Nested.Name);
    }

    [Fact]
    public async Task SetAsync_OverwritesExistingEntry()
    {
        _mockCacheData.Setup(x => x.SetEntryAsync(It.IsAny<CacheDataEntry>()))
            .ReturnsAsync(true);

        var original = new TestData { Name = "Original", Value = 1 };
        await _cacheModule.SetAsync("test_key", original, DateTime.UtcNow.AddHours(1));

        var updated = new TestData { Name = "Updated", Value = 2 };
        await _cacheModule.SetAsync("test_key", updated, DateTime.UtcNow.AddHours(1));

        _mockCacheData.Verify(x => x.SetEntryAsync(It.Is<CacheDataEntry>(e =>
            e.CacheKey == "test_key")), Times.Exactly(2));
    }

    private static byte[] CompressTestData<T>(T data)
    {
        var jsonBytes = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(data);
        using var output = new System.IO.MemoryStream();
        using (var gzip = new System.IO.Compression.GZipStream(output, System.IO.Compression.CompressionLevel.Optimal))
        {
            gzip.Write(jsonBytes, 0, jsonBytes.Length);
        }
        return output.ToArray();
    }

    private class TestData
    {
        public string Name { get; set; } = string.Empty;
        public int Value { get; set; }
    }

    private class ComplexTestData
    {
        public int ID { get; set; }
        public List<string> Items { get; set; } = [];
        public TestData? Nested { get; set; }
    }
}
