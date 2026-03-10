using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class SeasonTrendsModuleTests
{
    private readonly Mock<IPersistentCache> _mockCache;
    private readonly Mock<IOptions<CacheOptions>> _mockCacheOptions;
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<ILogger<SeasonTrendsModule>> _mockLogger;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<ISeasonModule> _mockSeasonModule;
    private readonly SeasonTrendsModule _module;

    public SeasonTrendsModuleTests()
    {
        _mockCache = new Mock<IPersistentCache>();
        _mockCacheOptions = new Mock<IOptions<CacheOptions>>();
        _mockCacheOptions.Setup(x => x.Value).Returns(new CacheOptions());
        _mockDataService = new Mock<ICFBDataService>();
        _mockLogger = new Mock<ILogger<SeasonTrendsModule>>();
        _mockRankingsModule = new Mock<IRankingsModule>();
        _mockSeasonModule = new Mock<ISeasonModule>();

        _module = new SeasonTrendsModule(
            _mockCache.Object,
            _mockCacheOptions.Object,
            _mockDataService.Object,
            _mockLogger.Object,
            _mockRankingsModule.Object,
            _mockSeasonModule.Object);
    }

    [Fact]
    public void Constructor_NullCache_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonTrendsModule(
                null!,
                _mockCacheOptions.Object,
                new Mock<ICFBDataService>().Object,
                new Mock<ILogger<SeasonTrendsModule>>().Object,
                new Mock<IRankingsModule>().Object,
                new Mock<ISeasonModule>().Object));
    }

    [Fact]
    public void Constructor_NullCacheOptions_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonTrendsModule(
                new Mock<IPersistentCache>().Object,
                null!,
                new Mock<ICFBDataService>().Object,
                new Mock<ILogger<SeasonTrendsModule>>().Object,
                new Mock<IRankingsModule>().Object,
                new Mock<ISeasonModule>().Object));
    }

    [Fact]
    public void Constructor_NullDataService_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonTrendsModule(
                new Mock<IPersistentCache>().Object,
                _mockCacheOptions.Object,
                null!,
                new Mock<ILogger<SeasonTrendsModule>>().Object,
                new Mock<IRankingsModule>().Object,
                new Mock<ISeasonModule>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonTrendsModule(
                new Mock<IPersistentCache>().Object,
                _mockCacheOptions.Object,
                new Mock<ICFBDataService>().Object,
                null!,
                new Mock<IRankingsModule>().Object,
                new Mock<ISeasonModule>().Object));
    }

    [Fact]
    public void Constructor_NullRankingsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonTrendsModule(
                new Mock<IPersistentCache>().Object,
                _mockCacheOptions.Object,
                new Mock<ICFBDataService>().Object,
                new Mock<ILogger<SeasonTrendsModule>>().Object,
                null!,
                new Mock<ISeasonModule>().Object));
    }

    [Fact]
    public void Constructor_NullSeasonModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonTrendsModule(
                new Mock<IPersistentCache>().Object,
                _mockCacheOptions.Object,
                new Mock<ICFBDataService>().Object,
                new Mock<ILogger<SeasonTrendsModule>>().Object,
                new Mock<IRankingsModule>().Object,
                null!));
    }

    [Fact]
    public async Task GetSeasonTrendsAsync_CacheHit_ReturnsCachedResult()
    {
        var cachedResult = new SeasonTrendsResult { Season = 2024 };
        _mockCache.Setup(x => x.GetAsync<SeasonTrendsResult>("season-trends_2024"))
            .ReturnsAsync(cachedResult);

        var result = await _module.GetSeasonTrendsAsync(2024);

        Assert.Equal(2024, result.Season);
        _mockRankingsModule.Verify(
            x => x.GetPublishedSnapshotsBySeasonRangeAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Fact]
    public async Task GetSeasonTrendsAsync_NoSnapshots_ReturnsEmptyResult()
    {
        SetupCacheMiss();
        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotsBySeasonRangeAsync(2024, 2024))
            .ReturnsAsync(Enumerable.Empty<RankingsResult>());
        _mockDataService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(Enumerable.Empty<CalendarWeek>());
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync(Enumerable.Empty<FBSTeam>());

        var result = await _module.GetSeasonTrendsAsync(2024);

        Assert.Equal(2024, result.Season);
        Assert.Empty(result.Teams);
        Assert.Empty(result.Weeks);
    }

    [Fact]
    public async Task GetSeasonTrendsAsync_SingleSnapshot_ReturnsCorrectData()
    {
        SetupCacheMiss();
        var snapshot = CreateSnapshot(2024, 3, new[]
        {
            CreateRankedTeam("Ohio State", 1, 95.0, 8, 1),
            CreateRankedTeam("Michigan", 2, 90.0, 7, 2),
        });

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotsBySeasonRangeAsync(2024, 2024))
            .ReturnsAsync(new[] { snapshot });
        _mockDataService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(new[] { new CalendarWeek { Week = 3, SeasonType = "regular" } });
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync(new[]
            {
                new FBSTeam { Name = "Ohio State", Color = "#BB0000", AltColor = "#666666" },
                new FBSTeam { Name = "Michigan", Color = "#00274C", AltColor = "#FFCB05" },
            });
        _mockSeasonModule.Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(new[] { new WeekInfo { WeekNumber = 3, Label = "Week 4" } });

        var result = await _module.GetSeasonTrendsAsync(2024);

        Assert.Equal(2, result.Teams.Count());
        Assert.Single(result.Weeks);

        var michigan = result.Teams.First(t => t.TeamName == "Michigan");
        Assert.Equal("#00274C", michigan.Color);
        Assert.Equal("#FFCB05", michigan.AltColor);
        Assert.Single(michigan.Rankings);
        Assert.Equal(2, michigan.Rankings.First().Rank);
    }

    [Fact]
    public async Task GetSeasonTrendsAsync_MultipleSnapshots_TracksRankChanges()
    {
        SetupCacheMiss();
        var snapshot1 = CreateSnapshot(2024, 1, new[]
        {
            CreateRankedTeam("Texas", 1, 95.0, 1, 0),
            CreateRankedTeam("Oklahoma", 2, 90.0, 1, 0),
        });
        var snapshot2 = CreateSnapshot(2024, 2, new[]
        {
            CreateRankedTeam("Oklahoma", 1, 96.0, 2, 0),
            CreateRankedTeam("Texas", 3, 88.0, 1, 1),
        });

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotsBySeasonRangeAsync(2024, 2024))
            .ReturnsAsync(new[] { snapshot1, snapshot2 });
        _mockDataService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(new[]
            {
                new CalendarWeek { Week = 1, SeasonType = "regular" },
                new CalendarWeek { Week = 2, SeasonType = "regular" },
            });
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync(Enumerable.Empty<FBSTeam>());
        _mockSeasonModule.Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(new[]
            {
                new WeekInfo { WeekNumber = 1, Label = "Week 2" },
                new WeekInfo { WeekNumber = 2, Label = "Week 3" },
            });

        var result = await _module.GetSeasonTrendsAsync(2024);

        Assert.Equal(2, result.Teams.Count());
        Assert.Equal(2, result.Weeks.Count());

        var oklahoma = result.Teams.First(t => t.TeamName == "Oklahoma");
        Assert.Equal(2, oklahoma.Rankings.Count());
        Assert.Equal(2, oklahoma.Rankings.First().Rank);
        Assert.Equal(1, oklahoma.Rankings.Last().Rank);
    }

    [Fact]
    public async Task GetSeasonTrendsAsync_TeamDropsOut_GetsNullRank()
    {
        SetupCacheMiss();
        var snapshot1 = CreateSnapshot(2024, 1, new[]
        {
            CreateRankedTeam("Nebraska", 25, 50.0, 1, 0),
        });
        var snapshot2 = CreateSnapshot(2024, 2, new[]
        {
            CreateRankedTeam("Iowa", 1, 95.0, 2, 0),
        });

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotsBySeasonRangeAsync(2024, 2024))
            .ReturnsAsync(new[] { snapshot1, snapshot2 });
        _mockDataService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(new[]
            {
                new CalendarWeek { Week = 1, SeasonType = "regular" },
                new CalendarWeek { Week = 2, SeasonType = "regular" },
            });
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync(Enumerable.Empty<FBSTeam>());
        _mockSeasonModule.Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(new[]
            {
                new WeekInfo { WeekNumber = 1, Label = "Week 2" },
                new WeekInfo { WeekNumber = 2, Label = "Week 3" },
            });

        var result = await _module.GetSeasonTrendsAsync(2024);

        var nebraska = result.Teams.First(t => t.TeamName == "Nebraska");
        Assert.Equal(2, nebraska.Rankings.Count());
        Assert.Equal(25, nebraska.Rankings.First().Rank);
        Assert.Null(nebraska.Rankings.Last().Rank);
    }

    [Fact]
    public async Task GetSeasonTrendsAsync_TeamsSortedAlphabetically()
    {
        SetupCacheMiss();
        var snapshot = CreateSnapshot(2024, 1, new[]
        {
            CreateRankedTeam("USC", 1, 95.0, 1, 0),
            CreateRankedTeam("Alabama", 2, 90.0, 1, 0),
            CreateRankedTeam("Notre Dame", 3, 85.0, 1, 0),
        });

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotsBySeasonRangeAsync(2024, 2024))
            .ReturnsAsync(new[] { snapshot });
        _mockDataService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(new[] { new CalendarWeek { Week = 1, SeasonType = "regular" } });
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync(Enumerable.Empty<FBSTeam>());
        _mockSeasonModule.Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(new[] { new WeekInfo { WeekNumber = 1, Label = "Week 2" } });

        var result = await _module.GetSeasonTrendsAsync(2024);

        var teamNames = result.Teams.Select(t => t.TeamName).ToList();
        Assert.Equal("Alabama", teamNames[0]);
        Assert.Equal("Notre Dame", teamNames[1]);
        Assert.Equal("USC", teamNames[2]);
    }

    [Fact]
    public async Task GetSeasonTrendsAsync_SetsCache()
    {
        SetupCacheMiss();
        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotsBySeasonRangeAsync(2024, 2024))
            .ReturnsAsync(Enumerable.Empty<RankingsResult>());
        _mockDataService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(Enumerable.Empty<CalendarWeek>());
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync(Enumerable.Empty<FBSTeam>());

        await _module.GetSeasonTrendsAsync(2024);

        // No cache set on empty result - returns early
        _mockCache.Verify(
            x => x.SetAsync(It.IsAny<string>(), It.IsAny<SeasonTrendsResult>(), It.IsAny<DateTime>()),
            Times.Never);
    }

    [Fact]
    public async Task GetSeasonTrendsAsync_WithSnapshots_SetsCache()
    {
        SetupCacheMiss();
        var snapshot = CreateSnapshot(2024, 1, new[]
        {
            CreateRankedTeam("Florida", 1, 95.0, 1, 0),
        });

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotsBySeasonRangeAsync(2024, 2024))
            .ReturnsAsync(new[] { snapshot });
        _mockDataService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(new[] { new CalendarWeek { Week = 1, SeasonType = "regular" } });
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync(Enumerable.Empty<FBSTeam>());
        _mockSeasonModule.Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(new[] { new WeekInfo { WeekNumber = 1, Label = "Week 2" } });

        await _module.GetSeasonTrendsAsync(2024);

        _mockCache.Verify(
            x => x.SetAsync("season-trends_2024", It.IsAny<SeasonTrendsResult>(), It.IsAny<DateTime>()),
            Times.Once);
    }

    [Fact]
    public async Task InvalidateCacheAsync_CallsRemoveByPrefix()
    {
        _mockCache.Setup(x => x.RemoveByPrefixAsync("season-trends_")).ReturnsAsync(3);

        await _module.InvalidateCacheAsync();

        _mockCache.Verify(x => x.RemoveByPrefixAsync("season-trends_"), Times.Once);
    }

    [Fact]
    public async Task GetSeasonTrendsAsync_ColorsFromFBSData()
    {
        SetupCacheMiss();
        var snapshot = CreateSnapshot(2024, 1, new[]
        {
            CreateRankedTeam("Texas", 1, 95.0, 1, 0),
        });

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotsBySeasonRangeAsync(2024, 2024))
            .ReturnsAsync(new[] { snapshot });
        _mockDataService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(new[] { new CalendarWeek { Week = 1, SeasonType = "regular" } });
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync(new[] { new FBSTeam { Name = "Texas", Color = "#BF5700", AltColor = "#FFFFFF" } });
        _mockSeasonModule.Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(new[] { new WeekInfo { WeekNumber = 1, Label = "Week 2" } });

        var result = await _module.GetSeasonTrendsAsync(2024);

        var texas = result.Teams.First();
        Assert.Equal("#BF5700", texas.Color);
        Assert.Equal("#FFFFFF", texas.AltColor);
    }

    [Fact]
    public async Task GetSeasonTrendsAsync_TeamNotInFBSData_GetsEmptyColors()
    {
        SetupCacheMiss();
        var snapshot = CreateSnapshot(2024, 1, new[]
        {
            CreateRankedTeam("Notre Dame", 1, 95.0, 1, 0),
        });

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotsBySeasonRangeAsync(2024, 2024))
            .ReturnsAsync(new[] { snapshot });
        _mockDataService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(new[] { new CalendarWeek { Week = 1, SeasonType = "regular" } });
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync(Enumerable.Empty<FBSTeam>());
        _mockSeasonModule.Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(new[] { new WeekInfo { WeekNumber = 1, Label = "Week 2" } });

        var result = await _module.GetSeasonTrendsAsync(2024);

        var team = result.Teams.First();
        Assert.Equal(string.Empty, team.Color);
        Assert.Equal(string.Empty, team.AltColor);
    }

    [Fact]
    public async Task GetSeasonTrendsAsync_OnlyTop25TeamsIncluded()
    {
        SetupCacheMiss();
        var snapshot = CreateSnapshot(2024, 1, new[]
        {
            CreateRankedTeam("Ohio State", 25, 50.0, 5, 3),
            CreateRankedTeam("Michigan", 26, 49.0, 4, 4),
        });

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotsBySeasonRangeAsync(2024, 2024))
            .ReturnsAsync(new[] { snapshot });
        _mockDataService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(new[] { new CalendarWeek { Week = 1, SeasonType = "regular" } });
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync(Enumerable.Empty<FBSTeam>());
        _mockSeasonModule.Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(new[] { new WeekInfo { WeekNumber = 1, Label = "Week 2" } });

        var result = await _module.GetSeasonTrendsAsync(2024);

        Assert.Single(result.Teams);
        Assert.Equal("Ohio State", result.Teams.First().TeamName);
    }

    [Fact]
    public async Task GetSeasonTrendsAsync_RecordFormat()
    {
        SetupCacheMiss();
        var snapshot = CreateSnapshot(2024, 1, new[]
        {
            CreateRankedTeam("Alabama", 1, 95.0, 10, 2),
        });

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotsBySeasonRangeAsync(2024, 2024))
            .ReturnsAsync(new[] { snapshot });
        _mockDataService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(new[] { new CalendarWeek { Week = 1, SeasonType = "regular" } });
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync(Enumerable.Empty<FBSTeam>());
        _mockSeasonModule.Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(new[] { new WeekInfo { WeekNumber = 1, Label = "Week 2" } });

        var result = await _module.GetSeasonTrendsAsync(2024);

        var ranking = result.Teams.First().Rankings.First();
        Assert.Equal("10-2", ranking.Record);
    }

    private void SetupCacheMiss()
    {
        _mockCache.Setup(x => x.GetAsync<SeasonTrendsResult>(It.IsAny<string>()))
            .ReturnsAsync((SeasonTrendsResult?)null);
    }

    private static RankingsResult CreateSnapshot(int season, int week, RankedTeam[] teams)
    {
        return new RankingsResult
        {
            Season = season,
            Week = week,
            Rankings = teams
        };
    }

    private static RankedTeam CreateRankedTeam(string name, int rank, double rating, int wins, int losses)
    {
        return new RankedTeam
        {
            TeamName = name,
            Rank = rank,
            Rating = rating,
            Wins = wins,
            Losses = losses,
            Conference = "Test Conference",
            LogoURL = $"https://example.com/{name.ToLower().Replace(" ", "-")}.png"
        };
    }
}
