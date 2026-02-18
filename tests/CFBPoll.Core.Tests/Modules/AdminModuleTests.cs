using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class AdminModuleTests
{
    private readonly Mock<IPersistentCache> _mockCache;
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<IExcelExportModule> _mockExcelExportModule;
    private readonly Mock<ILogger<AdminModule>> _mockLogger;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<IRatingModule> _mockRatingModule;
    private readonly AdminModule _adminModule;

    public AdminModuleTests()
    {
        _mockCache = new Mock<IPersistentCache>();
        _mockDataService = new Mock<ICFBDataService>();
        _mockExcelExportModule = new Mock<IExcelExportModule>();
        _mockLogger = new Mock<ILogger<AdminModule>>();
        _mockRankingsModule = new Mock<IRankingsModule>();
        _mockRatingModule = new Mock<IRatingModule>();

        _adminModule = new AdminModule(
            _mockDataService.Object,
            _mockExcelExportModule.Object,
            _mockCache.Object,
            _mockRankingsModule.Object,
            _mockRatingModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task CalculateRankingsAsync_CallsServicesInOrder()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeams(seasonData)).Returns(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        var result = await _adminModule.CalculateRankingsAsync(2024, 5);

        Assert.NotNull(result);
        Assert.Equal(2024, result.Rankings.Season);
        Assert.Equal(5, result.Rankings.Week);
        Assert.True(result.Persisted);
        _mockRankingsModule.Verify(x => x.SaveSnapshotAsync(rankings), Times.Once);
    }

    [Fact]
    public async Task CalculateRankingsAsync_ClearsCacheBeforeFetching()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeams(seasonData)).Returns(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        var callOrder = new List<string>();
        _mockCache.Setup(x => x.RemoveAsync("seasonData_2024_week_5"))
            .Callback(() => callOrder.Add("cache_remove"))
            .ReturnsAsync(true);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5))
            .Callback(() => callOrder.Add("get_season_data"))
            .ReturnsAsync(seasonData);

        await _adminModule.CalculateRankingsAsync(2024, 5);

        _mockCache.Verify(x => x.RemoveAsync("seasonData_2024_week_5"), Times.Once);
        Assert.Equal("cache_remove", callOrder[0]);
        Assert.Equal("get_season_data", callOrder[1]);
    }

    [Fact]
    public async Task CalculateRankingsAsync_PersistFailure_SetsPersistedFalse()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeams(seasonData)).Returns(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);
        _mockRankingsModule.Setup(x => x.SaveSnapshotAsync(It.IsAny<RankingsResult>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        var result = await _adminModule.CalculateRankingsAsync(2024, 5);

        Assert.False(result.Persisted);
    }

    [Fact]
    public async Task PublishSnapshotAsync_DelegatesToRankingsModule()
    {
        _mockRankingsModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.PublishSnapshotAsync(2024, 5);

        Assert.True(result);
        _mockRankingsModule.Verify(x => x.PublishSnapshotAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task DeleteSnapshotAsync_DelegatesToRankingsModule()
    {
        _mockRankingsModule.Setup(x => x.DeleteSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.DeleteSnapshotAsync(2024, 5);

        Assert.True(result);
        _mockRankingsModule.Verify(x => x.DeleteSnapshotAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task GetPersistedWeeksAsync_DelegatesToRankingsModule()
    {
        var weeks = new List<PersistedWeekSummary>
        {
            new PersistedWeekSummary { Season = 2024, Week = 1, Published = true }
        };

        _mockRankingsModule.Setup(x => x.GetPersistedWeeksAsync()).ReturnsAsync(weeks);

        var result = await _adminModule.GetPersistedWeeksAsync();

        Assert.Single(result);
        _mockRankingsModule.Verify(x => x.GetPersistedWeeksAsync(), Times.Once);
    }

    [Fact]
    public async Task ExportRankingsAsync_SnapshotExists_ReturnsBytes()
    {
        var snapshot = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        var expectedBytes = new byte[] { 1, 2, 3 };

        _mockRankingsModule.Setup(x => x.GetSnapshotAsync(2024, 5)).ReturnsAsync(snapshot);
        _mockExcelExportModule.Setup(x => x.GenerateRankingsWorkbook(snapshot)).Returns(expectedBytes);

        var result = await _adminModule.ExportRankingsAsync(2024, 5);

        Assert.Equal(expectedBytes, result);
    }

    [Fact]
    public async Task ExportRankingsAsync_NoSnapshot_ReturnsNull()
    {
        _mockRankingsModule.Setup(x => x.GetSnapshotAsync(2024, 5)).ReturnsAsync((RankingsResult?)null);

        var result = await _adminModule.ExportRankingsAsync(2024, 5);

        Assert.Null(result);
        _mockExcelExportModule.Verify(x => x.GenerateRankingsWorkbook(It.IsAny<RankingsResult>()), Times.Never);
    }
}
