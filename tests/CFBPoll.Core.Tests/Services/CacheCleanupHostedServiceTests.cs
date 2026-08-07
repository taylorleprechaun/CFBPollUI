using CFBPoll.Core.Caching;
using CFBPoll.Core.Options;
using CFBPoll.Core.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using MSOptions = Microsoft.Extensions.Options.Options;

namespace CFBPoll.Core.Tests.Services;

public class CacheCleanupHostedServiceTests
{
    private readonly Mock<IPersistentCache> _mockCache;
    private readonly Mock<ILogger<CacheCleanupHostedService>> _mockLogger;

    public CacheCleanupHostedServiceTests()
    {
        _mockCache = new Mock<IPersistentCache>();
        _mockLogger = new Mock<ILogger<CacheCleanupHostedService>>();
    }

    [Fact]
    public void Constructor_ThrowsOnNullCache()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CacheCleanupHostedService(null!, MSOptions.Create(new CacheOptions()), _mockLogger.Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullLogger()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CacheCleanupHostedService(_mockCache.Object, MSOptions.Create(new CacheOptions()), null!));
    }

    [Fact]
    public void Constructor_ThrowsOnNullOptions()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CacheCleanupHostedService(_mockCache.Object, null!, _mockLogger.Object));
    }

    [Fact]
    public async Task ExecuteAsync_CallsCleanupExpiredAsync_AfterStartupDelay()
    {
        _mockCache.Setup(x => x.CleanupExpiredAsync()).ReturnsAsync(3);
        var options = new CacheOptions { CleanupStartupDelayMinutes = 0, CleanupIntervalMinutes = 60 };
        var service = new CacheCleanupHostedService(_mockCache.Object, MSOptions.Create(options), _mockLogger.Object);

        await service.StartAsync(CancellationToken.None);
        await WaitUntilAsync(() => _mockCache.Invocations.Count >= 1, TimeSpan.FromSeconds(5));
        await service.StopAsync(CancellationToken.None);

        _mockCache.Verify(x => x.CleanupExpiredAsync(), Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecuteAsync_CallsCleanupExpiredAsync_Repeatedly_OnInterval()
    {
        var callCount = 0;
        _mockCache.Setup(x => x.CleanupExpiredAsync())
            .Callback(() => Interlocked.Increment(ref callCount))
            .ReturnsAsync(0);
        var options = new CacheOptions { CleanupStartupDelayMinutes = 0, CleanupIntervalMinutes = 0 };
        var service = new CacheCleanupHostedService(_mockCache.Object, MSOptions.Create(options), _mockLogger.Object);

        await service.StartAsync(CancellationToken.None);
        await WaitUntilAsync(() => callCount >= 2, TimeSpan.FromSeconds(5));
        await service.StopAsync(CancellationToken.None);

        Assert.True(callCount >= 2, $"Expected at least 2 cleanup calls, got {callCount}");
    }

    [Fact]
    public async Task ExecuteAsync_CancelledDuringStartupDelay_ExitsWithoutCallingCleanup()
    {
        var options = new CacheOptions { CleanupStartupDelayMinutes = 60, CleanupIntervalMinutes = 60 };
        var service = new CacheCleanupHostedService(_mockCache.Object, MSOptions.Create(options), _mockLogger.Object);

        await service.StartAsync(CancellationToken.None);
        await service.StopAsync(CancellationToken.None);

        _mockCache.Verify(x => x.CleanupExpiredAsync(), Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_CleanupThrows_LogsErrorAndContinuesLoop()
    {
        var callCount = 0;
        _mockCache.Setup(x => x.CleanupExpiredAsync())
            .Callback(() => Interlocked.Increment(ref callCount))
            .ThrowsAsync(new InvalidOperationException("SQLite locked"));
        var options = new CacheOptions { CleanupStartupDelayMinutes = 0, CleanupIntervalMinutes = 0 };
        var service = new CacheCleanupHostedService(_mockCache.Object, MSOptions.Create(options), _mockLogger.Object);

        await service.StartAsync(CancellationToken.None);
        await WaitUntilAsync(() => callCount >= 2, TimeSpan.FromSeconds(5));
        await service.StopAsync(CancellationToken.None);

        Assert.True(callCount >= 2, $"Expected the loop to continue after a failure, got {callCount} calls");
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<InvalidOperationException>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    private static async Task WaitUntilAsync(Func<bool> condition, TimeSpan timeout)
    {
        var deadline = DateTime.UtcNow + timeout;
        while (!condition() && DateTime.UtcNow < deadline)
        {
            await Task.Delay(10);
        }
    }
}
