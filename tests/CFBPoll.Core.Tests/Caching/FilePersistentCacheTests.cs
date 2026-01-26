using CFBPoll.Core.Caching;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Caching;

public class FilePersistentCacheTests : IDisposable
{
    private readonly Mock<ILogger<FilePersistentCache>> _mockLogger;
    private readonly string _testCacheDirectory;
    private readonly FilePersistentCache _cache;

    public FilePersistentCacheTests()
    {
        _mockLogger = new Mock<ILogger<FilePersistentCache>>();
        _testCacheDirectory = Path.Combine(Path.GetTempPath(), $"cfbpoll_test_cache_{Guid.NewGuid()}");

        var options = new Mock<IOptions<CacheOptions>>();
        options.Setup(x => x.Value).Returns(new CacheOptions { CacheDirectory = _testCacheDirectory });

        _cache = new FilePersistentCache(options.Object, _mockLogger.Object);
    }

    public void Dispose()
    {
        if (Directory.Exists(_testCacheDirectory))
        {
            Directory.Delete(_testCacheDirectory, true);
        }
    }

    [Fact]
    public void Constructor_CreatesDirectoryIfNotExists()
    {
        Assert.True(Directory.Exists(_testCacheDirectory));
    }

    [Fact]
    public void Constructor_ThrowsOnNullOptions()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new FilePersistentCache(null!, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullLogger()
    {
        var options = new Mock<IOptions<CacheOptions>>();
        options.Setup(x => x.Value).Returns(new CacheOptions { CacheDirectory = _testCacheDirectory });

        Assert.Throws<ArgumentNullException>(() =>
            new FilePersistentCache(options.Object, null!));
    }

    [Fact]
    public async Task SetAsync_StoresData()
    {
        var testData = new TestCacheData { Name = "Test", Value = 42 };

        var result = await _cache.SetAsync("test-key", testData, DateTime.UtcNow.AddHours(1));

        Assert.True(result);
        var files = Directory.GetFiles(_testCacheDirectory, "*.json");
        Assert.Single(files);
    }

    [Fact]
    public async Task SetAsync_ThrowsOnNullKey()
    {
        var testData = new TestCacheData { Name = "Test", Value = 42 };

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cache.SetAsync(null!, testData, DateTime.UtcNow.AddHours(1)));
    }

    [Fact]
    public async Task SetAsync_ThrowsOnEmptyKey()
    {
        var testData = new TestCacheData { Name = "Test", Value = 42 };

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cache.SetAsync("", testData, DateTime.UtcNow.AddHours(1)));
    }

    [Fact]
    public async Task SetAsync_ThrowsOnWhitespaceKey()
    {
        var testData = new TestCacheData { Name = "Test", Value = 42 };

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cache.SetAsync("   ", testData, DateTime.UtcNow.AddHours(1)));
    }

    [Fact]
    public async Task SetAsync_ThrowsOnNullData()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            _cache.SetAsync<TestCacheData>("test-key", null!, DateTime.UtcNow.AddHours(1)));
    }

    [Fact]
    public async Task GetAsync_RetrievesStoredData()
    {
        var testData = new TestCacheData { Name = "Test", Value = 42 };
        await _cache.SetAsync("test-key", testData, DateTime.UtcNow.AddHours(1));

        var result = await _cache.GetAsync<TestCacheData>("test-key");

        Assert.NotNull(result);
        Assert.Equal("Test", result.Name);
        Assert.Equal(42, result.Value);
    }

    [Fact]
    public async Task GetAsync_ReturnsNullForNonExistentKey()
    {
        var result = await _cache.GetAsync<TestCacheData>("non-existent-key");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAsync_ThrowsOnNullKey()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cache.GetAsync<TestCacheData>(null!));
    }

    [Fact]
    public async Task GetAsync_ThrowsOnEmptyKey()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cache.GetAsync<TestCacheData>(""));
    }

    [Fact]
    public async Task GetAsync_ReturnsNullAndDeletesExpiredEntry()
    {
        var testData = new TestCacheData { Name = "Test", Value = 42 };
        await _cache.SetAsync("test-key", testData, DateTime.UtcNow.AddSeconds(-1));

        var result = await _cache.GetAsync<TestCacheData>("test-key");

        Assert.Null(result);
        var files = Directory.GetFiles(_testCacheDirectory, "*.json");
        Assert.Empty(files);
    }

    [Fact]
    public async Task RemoveAsync_RemovesExistingEntry()
    {
        var testData = new TestCacheData { Name = "Test", Value = 42 };
        await _cache.SetAsync("test-key", testData, DateTime.UtcNow.AddHours(1));

        var result = await _cache.RemoveAsync("test-key");

        Assert.True(result);
        var files = Directory.GetFiles(_testCacheDirectory, "*.json");
        Assert.Empty(files);
    }

    [Fact]
    public async Task RemoveAsync_ReturnsFalseForNonExistentKey()
    {
        var result = await _cache.RemoveAsync("non-existent-key");

        Assert.False(result);
    }

    [Fact]
    public async Task RemoveAsync_ThrowsOnNullKey()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cache.RemoveAsync(null!));
    }

    [Fact]
    public async Task RemoveAsync_ThrowsOnEmptyKey()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _cache.RemoveAsync(""));
    }

    [Fact]
    public async Task CleanupExpiredAsync_RemovesExpiredEntries()
    {
        var testData = new TestCacheData { Name = "Test", Value = 42 };
        await _cache.SetAsync("expired-key", testData, DateTime.UtcNow.AddSeconds(-1));
        await _cache.SetAsync("valid-key", testData, DateTime.UtcNow.AddHours(1));

        var removedCount = await _cache.CleanupExpiredAsync();

        Assert.Equal(1, removedCount);
        var files = Directory.GetFiles(_testCacheDirectory, "*.json");
        Assert.Single(files);
    }

    [Fact]
    public async Task CleanupExpiredAsync_ReturnsZeroWhenNoExpiredEntries()
    {
        var testData = new TestCacheData { Name = "Test", Value = 42 };
        await _cache.SetAsync("valid-key", testData, DateTime.UtcNow.AddHours(1));

        var removedCount = await _cache.CleanupExpiredAsync();

        Assert.Equal(0, removedCount);
    }

    [Fact]
    public async Task CleanupExpiredAsync_HandlesEmptyDirectory()
    {
        var removedCount = await _cache.CleanupExpiredAsync();

        Assert.Equal(0, removedCount);
    }

    [Fact]
    public async Task SetAsync_SanitizesSpecialCharactersInKey()
    {
        var testData = new TestCacheData { Name = "Test", Value = 42 };

        var result = await _cache.SetAsync("key:with/special\\chars?", testData, DateTime.UtcNow.AddHours(1));

        Assert.True(result);
        var retrievedData = await _cache.GetAsync<TestCacheData>("key:with/special\\chars?");
        Assert.NotNull(retrievedData);
        Assert.Equal("Test", retrievedData.Name);
    }

    [Fact]
    public async Task SetAsync_OverwritesExistingEntry()
    {
        var originalData = new TestCacheData { Name = "Original", Value = 1 };
        var updatedData = new TestCacheData { Name = "Updated", Value = 2 };

        await _cache.SetAsync("test-key", originalData, DateTime.UtcNow.AddHours(1));
        await _cache.SetAsync("test-key", updatedData, DateTime.UtcNow.AddHours(1));

        var result = await _cache.GetAsync<TestCacheData>("test-key");

        Assert.NotNull(result);
        Assert.Equal("Updated", result.Name);
        Assert.Equal(2, result.Value);
    }

    [Fact]
    public async Task GetAsync_HandlesComplexObjects()
    {
        var testData = new ComplexTestData
        {
            ID = 123,
            Items = new List<string> { "item1", "item2", "item3" },
            Nested = new TestCacheData { Name = "Nested", Value = 456 }
        };

        await _cache.SetAsync("complex-key", testData, DateTime.UtcNow.AddHours(1));
        var result = await _cache.GetAsync<ComplexTestData>("complex-key");

        Assert.NotNull(result);
        Assert.Equal(123, result.ID);
        Assert.Equal(3, result.Items.Count);
        Assert.NotNull(result.Nested);
        Assert.Equal("Nested", result.Nested.Name);
    }

    private class TestCacheData
    {
        public string Name { get; set; } = string.Empty;
        public int Value { get; set; }
    }

    private class ComplexTestData
    {
        public int ID { get; set; }
        public List<string> Items { get; set; } = new();
        public TestCacheData? Nested { get; set; }
    }

    [Fact]
    public async Task GetAsync_ReturnsNullWhenJsonIsCorrupted()
    {
        var filePath = Path.Combine(_testCacheDirectory, "corrupted_key.json");
        await File.WriteAllTextAsync(filePath, "{ invalid json }");

        var result = await _cache.GetAsync<TestCacheData>("corrupted_key");

        Assert.Null(result);
    }

    [Fact]
    public async Task CleanupExpiredAsync_HandlesCorruptedFiles()
    {
        var validData = new TestCacheData { Name = "Valid", Value = 1 };
        await _cache.SetAsync("valid-key", validData, DateTime.UtcNow.AddHours(1));

        var corruptedFilePath = Path.Combine(_testCacheDirectory, "corrupted.json");
        await File.WriteAllTextAsync(corruptedFilePath, "{ not valid json }");

        var removedCount = await _cache.CleanupExpiredAsync();

        Assert.Equal(0, removedCount);
    }

    [Fact]
    public async Task CleanupExpiredAsync_HandlesFilesWithoutExpiresAt()
    {
        var filePath = Path.Combine(_testCacheDirectory, "no_expires.json");
        await File.WriteAllTextAsync(filePath, "{ \"Data\": { \"Name\": \"Test\" } }");

        var removedCount = await _cache.CleanupExpiredAsync();

        Assert.Equal(0, removedCount);
    }
}
