using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using CFBPoll.Core.Services;
using CFBPoll.Core.Tests.TestDoubles;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using MSOptions = Microsoft.Extensions.Options.Options;

namespace CFBPoll.Core.Tests.Services;

public class ScheduledCacheRefreshHostedServiceTests
{
    private readonly Mock<IPersistentCache> _mockCache;
    private readonly Mock<ICacheExpirationPolicy> _mockExpirationPolicy;
    private readonly Mock<ILogger<ScheduledCacheRefreshHostedService>> _mockLogger;
    private readonly Mock<IPollLeadersModule> _mockPollLeadersModule;
    private readonly Mock<ICFBDataCacheRefresher> _mockRefresher;
    private readonly Mock<ISeasonTrendsModule> _mockSeasonTrendsModule;
    private readonly Mock<ITeamPredictionRecordModule> _mockTeamPredictionRecordModule;
    private readonly Mock<ITrackRecordModule> _mockTrackRecordModule;
    private readonly FixedTimeProvider _timeProvider;

    public ScheduledCacheRefreshHostedServiceTests()
    {
        _mockCache = new Mock<IPersistentCache>();
        _mockExpirationPolicy = new Mock<ICacheExpirationPolicy>();
        _mockLogger = new Mock<ILogger<ScheduledCacheRefreshHostedService>>();
        _mockPollLeadersModule = new Mock<IPollLeadersModule>();
        _mockRefresher = new Mock<ICFBDataCacheRefresher>();
        _mockSeasonTrendsModule = new Mock<ISeasonTrendsModule>();
        _mockTeamPredictionRecordModule = new Mock<ITeamPredictionRecordModule>();
        _mockTrackRecordModule = new Mock<ITrackRecordModule>();
        _timeProvider = new FixedTimeProvider(new DateTimeOffset(2026, 10, 8, 12, 0, 0, TimeSpan.Zero));

        _mockRefresher.Setup(x => x.RefreshMaxSeasonYearAsync()).ReturnsAsync(2026);
        _mockRefresher.Setup(x => x.RefreshCalendarAsync(It.IsAny<int>())).ReturnsAsync(true);
        _mockRefresher.Setup(x => x.RefreshConferencesAsync()).ReturnsAsync(true);
        _mockRefresher.Setup(x => x.RefreshFBSTeamsAsync(It.IsAny<int>())).ReturnsAsync(true);
        _mockRefresher.Setup(x => x.RefreshFullSeasonScheduleAsync(It.IsAny<int>())).ReturnsAsync(true);

        // Next daily refresh is a day away, so the background loop never fires during a test
        _mockExpirationPolicy.Setup(x => x.GetNextRefreshUTC(It.IsAny<CacheRefreshTier>()))
            .Returns(new DateTime(2026, 10, 9, 7, 0, 0, DateTimeKind.Utc));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    [InlineData(6)]
    [InlineData(7)]
    [InlineData(8)]
    [InlineData(9)]
    public void Constructor_NullDependency_ThrowsArgumentNullException(int nullIndex)
    {
        object?[] args =
        [
            _mockRefresher.Object,
            _mockCache.Object,
            _mockExpirationPolicy.Object,
            _mockPollLeadersModule.Object,
            _mockSeasonTrendsModule.Object,
            _mockTeamPredictionRecordModule.Object,
            _mockTrackRecordModule.Object,
            MSOptions.Create(new CacheOptions()),
            _timeProvider,
            _mockLogger.Object,
        ];
        args[nullIndex] = null;

        var exception = Assert.Throws<System.Reflection.TargetInvocationException>(
            () => Activator.CreateInstance(typeof(ScheduledCacheRefreshHostedService), args));

        Assert.IsType<ArgumentNullException>(exception.InnerException);
    }

    [Fact]
    public async Task ExecuteAsync_ScheduledRefreshDisabled_DoesNotRefreshAnything()
    {
        var service = CreateService(new CacheOptions { ScheduledRefreshEnabled = false, RefreshStartupDelayMinutes = 0 });

        await service.StartAsync(CancellationToken.None);
        await Task.Delay(200);
        await service.StopAsync(CancellationToken.None);

        _mockRefresher.Verify(x => x.RefreshMaxSeasonYearAsync(), Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_StartupDelayElapsed_WarmsMissingEntries()
    {
        _mockCache.Setup(x => x.GetAllEntriesMetadataAsync()).ReturnsAsync([]);
        var service = CreateService(new CacheOptions { RefreshStartupDelayMinutes = 0 });

        await service.StartAsync(CancellationToken.None);
        await WaitUntilAsync(
            () => _mockRefresher.Invocations.Any(i => i.Method.Name == nameof(ICFBDataCacheRefresher.RefreshFullSeasonScheduleAsync)),
            TimeSpan.FromSeconds(5));
        await service.StopAsync(CancellationToken.None);

        _mockRefresher.Verify(x => x.RefreshFullSeasonScheduleAsync(2026), Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_ConcludedSeason_SkipsTeamsAndSchedule()
    {
        _mockRefresher.Setup(x => x.RefreshMaxSeasonYearAsync()).ReturnsAsync(2024);
        var service = CreateService();

        await service.RefreshAsync(includeWeekly: false);

        _mockRefresher.Verify(x => x.RefreshFBSTeamsAsync(It.IsAny<int>()), Times.Never);
        _mockRefresher.Verify(x => x.RefreshFullSeasonScheduleAsync(It.IsAny<int>()), Times.Never);
        _mockTrackRecordModule.Verify(x => x.GetTrackRecordAsync(), Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_CurrentSeasonUnknown_SkipsSeasonScopedItems()
    {
        _mockRefresher.Setup(x => x.RefreshMaxSeasonYearAsync()).ThrowsAsync(new HttpRequestException("CFBD unavailable"));
        var service = CreateService();

        var result = await service.RefreshAsync(includeWeekly: true);

        Assert.Equal(1, result.Failed);
        Assert.Equal(0, result.Refreshed);
        _mockRefresher.Verify(x => x.RefreshConferencesAsync(), Times.Never);
        _mockRefresher.Verify(x => x.RefreshFBSTeamsAsync(It.IsAny<int>()), Times.Never);
        _mockTrackRecordModule.Verify(x => x.GetTrackRecordAsync(), Times.Never);
    }

    [Fact]
    public async Task RefreshAsync_DailyRun_RefreshesLiveSeasonItemsWithoutWeeklyItems()
    {
        var service = CreateService();

        var result = await service.RefreshAsync(includeWeekly: false);

        _mockRefresher.Verify(x => x.RefreshFBSTeamsAsync(2026), Times.Once);
        _mockRefresher.Verify(x => x.RefreshFullSeasonScheduleAsync(2026), Times.Once);
        _mockRefresher.Verify(x => x.RefreshConferencesAsync(), Times.Never);
        _mockRefresher.Verify(x => x.RefreshCalendarAsync(It.IsAny<int>()), Times.Never);
        // Season year + teams + schedule + four derived caches
        Assert.Equal(7, result.Refreshed);
        Assert.Equal(0, result.Failed);
    }

    [Fact]
    public async Task RefreshAsync_LiveSeason_RebuildsDerivedCachesAfterApiItems()
    {
        var callOrder = new List<string>();
        _mockRefresher.Setup(x => x.RefreshFullSeasonScheduleAsync(2026))
            .Callback(() => callOrder.Add("schedule"))
            .ReturnsAsync(true);
        _mockTrackRecordModule.Setup(x => x.InvalidateCacheAsync()).Callback(() => callOrder.Add("invalidate track record"));
        _mockTrackRecordModule.Setup(x => x.GetTrackRecordAsync())
            .Callback(() => callOrder.Add("rebuild track record"))
            .ReturnsAsync(new TrackRecordResult());
        var service = CreateService();

        await service.RefreshAsync(includeWeekly: false);

        Assert.Equal(["schedule", "invalidate track record", "rebuild track record"], callOrder);
        _mockTeamPredictionRecordModule.Verify(x => x.GetTeamRecordsAsync(2026), Times.Once);
        _mockSeasonTrendsModule.Verify(x => x.GetSeasonTrendsAsync(2026), Times.Once);
        _mockPollLeadersModule.Verify(x => x.GetPollLeadersAsync(null, null), Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_StepFails_ContinuesWithRemainingSteps()
    {
        _mockRefresher.Setup(x => x.RefreshFBSTeamsAsync(2026)).ThrowsAsync(new HttpRequestException("CFBD timeout"));
        var service = CreateService();

        var result = await service.RefreshAsync(includeWeekly: false);

        Assert.Equal(1, result.Failed);
        _mockRefresher.Verify(x => x.RefreshFullSeasonScheduleAsync(2026), Times.Once);
        _mockTrackRecordModule.Verify(x => x.GetTrackRecordAsync(), Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_StepKeepsExistingData_CountsKeptExisting()
    {
        _mockRefresher.Setup(x => x.RefreshFBSTeamsAsync(2026)).ReturnsAsync(false);
        var service = CreateService();

        var result = await service.RefreshAsync(includeWeekly: false);

        Assert.Equal(1, result.KeptExisting);
        Assert.Equal(0, result.Failed);
    }

    [Fact]
    public async Task RefreshAsync_WeeklyRun_IncludesConferencesAndBothCalendars()
    {
        var service = CreateService();

        await service.RefreshAsync(includeWeekly: true);

        _mockRefresher.Verify(x => x.RefreshConferencesAsync(), Times.Once);
        _mockRefresher.Verify(x => x.RefreshCalendarAsync(2026), Times.Once);
        _mockRefresher.Verify(x => x.RefreshCalendarAsync(2027), Times.Once);
    }

    [Fact]
    public async Task WarmMissingAsync_SomeEntriesCached_RefreshesOnlyMissingOrExpiredEntries()
    {
        var future = new DateTime(2026, 10, 9, 7, 30, 0, DateTimeKind.Utc);
        var past = new DateTime(2026, 10, 8, 7, 30, 0, DateTimeKind.Utc);
        _mockCache.Setup(x => x.GetAllEntriesMetadataAsync()).ReturnsAsync(
        [
            new CacheEntryMetadata { CacheKey = "conferences", ExpiresAt = future },
            new CacheEntryMetadata { CacheKey = "teams_2026", ExpiresAt = future },
            new CacheEntryMetadata { CacheKey = "calendar_2026", ExpiresAt = past },
        ]);
        var service = CreateService();

        var result = await service.WarmMissingAsync();

        _mockRefresher.Verify(x => x.RefreshConferencesAsync(), Times.Never);
        _mockRefresher.Verify(x => x.RefreshFBSTeamsAsync(It.IsAny<int>()), Times.Never);
        _mockRefresher.Verify(x => x.RefreshCalendarAsync(2026), Times.Once);
        _mockRefresher.Verify(x => x.RefreshCalendarAsync(2027), Times.Once);
        _mockRefresher.Verify(x => x.RefreshFullSeasonScheduleAsync(2026), Times.Once);
        _mockTrackRecordModule.Verify(x => x.GetTrackRecordAsync(), Times.Never);
        // Season year + calendar_2026 + calendar_2027 + fullSchedule_2026
        Assert.Equal(4, result.Refreshed);
    }

    private static async Task WaitUntilAsync(Func<bool> condition, TimeSpan timeout)
    {
        var deadline = DateTime.UtcNow + timeout;
        while (!condition() && DateTime.UtcNow < deadline)
        {
            await Task.Delay(20);
        }
    }

    private ScheduledCacheRefreshHostedService CreateService(CacheOptions? options = null)
    {
        return new ScheduledCacheRefreshHostedService(
            _mockRefresher.Object,
            _mockCache.Object,
            _mockExpirationPolicy.Object,
            _mockPollLeadersModule.Object,
            _mockSeasonTrendsModule.Object,
            _mockTeamPredictionRecordModule.Object,
            _mockTrackRecordModule.Object,
            MSOptions.Create(options ?? new CacheOptions()),
            _timeProvider,
            _mockLogger.Object);
    }
}
