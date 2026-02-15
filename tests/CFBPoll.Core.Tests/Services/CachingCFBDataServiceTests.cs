using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using CFBPoll.Core.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Services;

public class CachingCFBDataServiceTests
{
    private readonly Mock<ICFBDataService> _mockInnerService;
    private readonly Mock<IPersistentCache> _mockCache;
    private readonly Mock<IOptions<CacheOptions>> _mockOptions;
    private readonly Mock<ILogger<CachingCFBDataService>> _mockLogger;
    private readonly CachingCFBDataService _service;

    public CachingCFBDataServiceTests()
    {
        _mockInnerService = new Mock<ICFBDataService>();
        _mockCache = new Mock<IPersistentCache>();
        _mockOptions = new Mock<IOptions<CacheOptions>>();
        _mockLogger = new Mock<ILogger<CachingCFBDataService>>();

        _mockOptions.Setup(x => x.Value).Returns(new CacheOptions
        {
            CalendarExpirationHours = 168,
            MaxSeasonYearExpirationHours = 24,
            SeasonDataExpirationHours = 24
        });

        _service = new CachingCFBDataService(
            _mockInnerService.Object,
            _mockCache.Object,
            _mockOptions.Object,
            _mockLogger.Object);
    }

    [Fact]
    public void Constructor_ThrowsOnNullInnerService()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CachingCFBDataService(null!, _mockCache.Object, _mockOptions.Object, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullCache()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CachingCFBDataService(_mockInnerService.Object, null!, _mockOptions.Object, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullOptions()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CachingCFBDataService(_mockInnerService.Object, _mockCache.Object, null!, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullLogger()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CachingCFBDataService(_mockInnerService.Object, _mockCache.Object, _mockOptions.Object, null!));
    }

    [Fact]
    public async Task GetCalendarAsync_ReturnsCachedData_WhenCacheHit()
    {
        var cachedData = new List<CalendarWeek>
        {
            new CalendarWeek { Week = 1, SeasonType = "regular", StartDate = DateTime.Now, EndDate = DateTime.Now }
        };

        _mockCache.Setup(x => x.GetAsync<List<CalendarWeek>>("calendar_2024"))
            .ReturnsAsync(cachedData);

        var result = await _service.GetCalendarAsync(2024);

        Assert.Single(result);
        _mockInnerService.Verify(x => x.GetCalendarAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetCalendarAsync_FetchesFromInnerService_WhenCacheMiss()
    {
        var apiData = new List<CalendarWeek>
        {
            new CalendarWeek { Week = 1, SeasonType = "regular", StartDate = DateTime.Now, EndDate = DateTime.Now }
        };

        _mockCache.Setup(x => x.GetAsync<List<CalendarWeek>>("calendar_2024"))
            .ReturnsAsync((List<CalendarWeek>?)null);
        _mockInnerService.Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(apiData);

        var result = await _service.GetCalendarAsync(2024);

        Assert.Single(result);
        _mockInnerService.Verify(x => x.GetCalendarAsync(2024), Times.Once);
        _mockCache.Verify(x => x.SetAsync("calendar_2024", It.IsAny<List<CalendarWeek>>(), It.IsAny<DateTime>()), Times.Once);
    }

    [Fact]
    public async Task GetCalendarAsync_UsesLongExpiration_ForPastYears()
    {
        var pastYear = DateTime.Now.Year - 1;
        var apiData = new List<CalendarWeek>();

        _mockCache.Setup(x => x.GetAsync<List<CalendarWeek>>($"calendar_{pastYear}"))
            .ReturnsAsync((List<CalendarWeek>?)null);
        _mockInnerService.Setup(x => x.GetCalendarAsync(pastYear))
            .ReturnsAsync(apiData);

        DateTime capturedExpiration = default;
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<List<CalendarWeek>>(), It.IsAny<DateTime>()))
            .Callback<string, List<CalendarWeek>, DateTime>((_, _, exp) => capturedExpiration = exp)
            .ReturnsAsync(true);

        await _service.GetCalendarAsync(pastYear);

        var daysUntilExpiration = (capturedExpiration - DateTime.UtcNow).TotalDays;
        Assert.True(daysUntilExpiration > 300);
    }

    [Fact]
    public async Task GetCalendarAsync_UsesShortExpiration_ForCurrentYear()
    {
        var currentYear = DateTime.Now.Year;
        var apiData = new List<CalendarWeek>();

        _mockCache.Setup(x => x.GetAsync<List<CalendarWeek>>($"calendar_{currentYear}"))
            .ReturnsAsync((List<CalendarWeek>?)null);
        _mockInnerService.Setup(x => x.GetCalendarAsync(currentYear))
            .ReturnsAsync(apiData);

        DateTime capturedExpiration = default;
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<List<CalendarWeek>>(), It.IsAny<DateTime>()))
            .Callback<string, List<CalendarWeek>, DateTime>((_, _, exp) => capturedExpiration = exp)
            .ReturnsAsync(true);

        await _service.GetCalendarAsync(currentYear);

        var hoursUntilExpiration = (capturedExpiration - DateTime.UtcNow).TotalHours;
        Assert.True(hoursUntilExpiration <= 168);
    }

    [Fact]
    public async Task GetMaxSeasonYearAsync_ReturnsCachedData_WhenCacheHit()
    {
        var cachedData = new CachingCFBDataService.MaxSeasonYearWrapper { Year = 2024 };

        _mockCache.Setup(x => x.GetAsync<CachingCFBDataService.MaxSeasonYearWrapper>("maxSeasonYear"))
            .ReturnsAsync(cachedData);

        var result = await _service.GetMaxSeasonYearAsync();

        Assert.Equal(2024, result);
        _mockInnerService.Verify(x => x.GetMaxSeasonYearAsync(), Times.Never);
    }

    [Fact]
    public async Task GetMaxSeasonYearAsync_FetchesFromInnerService_AndCachesResult()
    {
        _mockInnerService.Setup(x => x.GetMaxSeasonYearAsync())
            .ReturnsAsync(2024);

        var result = await _service.GetMaxSeasonYearAsync();

        Assert.Equal(2024, result);
        _mockInnerService.Verify(x => x.GetMaxSeasonYearAsync(), Times.Once);
    }

    [Fact]
    public async Task GetMaxSeasonYearAsync_ReturnsCorrectYear()
    {
        _mockInnerService.Setup(x => x.GetMaxSeasonYearAsync())
            .ReturnsAsync(2025);

        var result = await _service.GetMaxSeasonYearAsync();

        Assert.Equal(2025, result);
    }

    [Fact]
    public async Task GetConferencesAsync_ReturnsCachedData_WhenCacheHit()
    {
        var cachedData = new List<Conference>
        {
            new Conference { ID = 1, Name = "SEC", Abbreviation = "SEC" }
        };

        _mockCache.Setup(x => x.GetAsync<List<Conference>>("conferences"))
            .ReturnsAsync(cachedData);

        var result = await _service.GetConferencesAsync();

        Assert.Single(result);
        Assert.Equal("SEC", result.First().Name);
        _mockInnerService.Verify(x => x.GetConferencesAsync(), Times.Never);
    }

    [Fact]
    public async Task GetConferencesAsync_FetchesFromInnerService_WhenCacheMiss()
    {
        var apiData = new List<Conference>
        {
            new Conference { ID = 1, Name = "Big Ten", Abbreviation = "B1G" }
        };

        _mockCache.Setup(x => x.GetAsync<List<Conference>>("conferences"))
            .ReturnsAsync((List<Conference>?)null);
        _mockInnerService.Setup(x => x.GetConferencesAsync())
            .ReturnsAsync(apiData);

        var result = await _service.GetConferencesAsync();

        Assert.Single(result);
        Assert.Equal("Big Ten", result.First().Name);
        _mockInnerService.Verify(x => x.GetConferencesAsync(), Times.Once);
        _mockCache.Verify(x => x.SetAsync("conferences", It.IsAny<List<Conference>>(), It.IsAny<DateTime>()), Times.Once);
    }

    [Fact]
    public async Task GetSeasonDataAsync_ReturnsCachedData_WhenCacheHit()
    {
        var cachedData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>()
        };

        _mockCache.Setup(x => x.GetAsync<SeasonData>("seasonData_2024_week_5"))
            .ReturnsAsync(cachedData);

        var result = await _service.GetSeasonDataAsync(2024, 5);

        Assert.Equal(2024, result.Season);
        Assert.Equal(5, result.Week);
        _mockInnerService.Verify(x => x.GetSeasonDataAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetSeasonDataAsync_FetchesFromInnerService_WhenCacheMiss()
    {
        var apiData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>()
        };

        _mockCache.Setup(x => x.GetAsync<SeasonData>("seasonData_2024_week_5"))
            .ReturnsAsync((SeasonData?)null);
        _mockInnerService.Setup(x => x.GetSeasonDataAsync(2024, 5))
            .ReturnsAsync(apiData);

        var result = await _service.GetSeasonDataAsync(2024, 5);

        Assert.Equal(2024, result.Season);
        _mockInnerService.Verify(x => x.GetSeasonDataAsync(2024, 5), Times.Once);
        _mockCache.Verify(x => x.SetAsync("seasonData_2024_week_5", It.IsAny<SeasonData>(), It.IsAny<DateTime>()), Times.Once);
    }

    [Fact]
    public async Task GetSeasonDataAsync_UsesLongExpiration_ForPastSeasons()
    {
        var pastSeason = DateTime.Now.Year - 1;
        var apiData = new SeasonData { Season = pastSeason, Week = 5, Teams = new Dictionary<string, TeamInfo>() };

        _mockCache.Setup(x => x.GetAsync<SeasonData>($"seasonData_{pastSeason}_week_5"))
            .ReturnsAsync((SeasonData?)null);
        _mockInnerService.Setup(x => x.GetSeasonDataAsync(pastSeason, 5))
            .ReturnsAsync(apiData);

        DateTime capturedExpiration = default;
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<SeasonData>(), It.IsAny<DateTime>()))
            .Callback<string, SeasonData, DateTime>((_, _, exp) => capturedExpiration = exp)
            .ReturnsAsync(true);

        await _service.GetSeasonDataAsync(pastSeason, 5);

        var daysUntilExpiration = (capturedExpiration - DateTime.UtcNow).TotalDays;
        Assert.True(daysUntilExpiration > 300);
    }

    [Fact]
    public async Task GetSeasonDataAsync_UsesShortExpiration_ForCurrentSeason()
    {
        var currentSeason = DateTime.Now.Year;
        var apiData = new SeasonData { Season = currentSeason, Week = 5, Teams = new Dictionary<string, TeamInfo>() };

        _mockCache.Setup(x => x.GetAsync<SeasonData>($"seasonData_{currentSeason}_week_5"))
            .ReturnsAsync((SeasonData?)null);
        _mockInnerService.Setup(x => x.GetSeasonDataAsync(currentSeason, 5))
            .ReturnsAsync(apiData);

        DateTime capturedExpiration = default;
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<SeasonData>(), It.IsAny<DateTime>()))
            .Callback<string, SeasonData, DateTime>((_, _, exp) => capturedExpiration = exp)
            .ReturnsAsync(true);

        await _service.GetSeasonDataAsync(currentSeason, 5);

        var hoursUntilExpiration = (capturedExpiration - DateTime.UtcNow).TotalHours;
        Assert.True(hoursUntilExpiration <= 24);
    }

    [Fact]
    public async Task GetSeasonDataAsync_UsesDifferentCacheKeys_ForDifferentWeeks()
    {
        var apiData = new SeasonData { Season = 2024, Week = 1, Teams = new Dictionary<string, TeamInfo>() };

        _mockCache.Setup(x => x.GetAsync<SeasonData>(It.IsAny<string>()))
            .ReturnsAsync((SeasonData?)null);
        _mockInnerService.Setup(x => x.GetSeasonDataAsync(2024, It.IsAny<int>()))
            .ReturnsAsync(apiData);

        await _service.GetSeasonDataAsync(2024, 1);
        await _service.GetSeasonDataAsync(2024, 5);

        _mockCache.Verify(x => x.GetAsync<SeasonData>("seasonData_2024_week_1"), Times.Once);
        _mockCache.Verify(x => x.GetAsync<SeasonData>("seasonData_2024_week_5"), Times.Once);
    }

    [Fact]
    public async Task GetFullSeasonScheduleAsync_ReturnsCachedData_WhenCacheHit()
    {
        var cachedData = new List<ScheduleGame>
        {
            new ScheduleGame
            {
                GameID = 1,
                Week = 1,
                SeasonType = "regular",
                HomeTeam = "Alabama",
                AwayTeam = "Georgia",
                HomePoints = 28,
                AwayPoints = 24,
                Completed = true
            }
        };

        _mockCache.Setup(x => x.GetAsync<List<ScheduleGame>>("fullSchedule_2024"))
            .ReturnsAsync(cachedData);

        var result = await _service.GetFullSeasonScheduleAsync(2024);

        Assert.Single(result);
        Assert.Equal("Alabama", result.First().HomeTeam);
        _mockInnerService.Verify(x => x.GetFullSeasonScheduleAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetFullSeasonScheduleAsync_FetchesFromInnerService_WhenCacheMiss()
    {
        var apiData = new List<ScheduleGame>
        {
            new ScheduleGame
            {
                GameID = 1,
                Week = 1,
                SeasonType = "regular",
                HomeTeam = "Ohio State",
                AwayTeam = "Michigan",
                HomePoints = 42,
                AwayPoints = 35,
                Completed = true
            }
        };

        _mockCache.Setup(x => x.GetAsync<List<ScheduleGame>>("fullSchedule_2024"))
            .ReturnsAsync((List<ScheduleGame>?)null);
        _mockInnerService.Setup(x => x.GetFullSeasonScheduleAsync(2024))
            .ReturnsAsync(apiData);

        var result = await _service.GetFullSeasonScheduleAsync(2024);

        Assert.Single(result);
        Assert.Equal("Ohio State", result.First().HomeTeam);
        _mockInnerService.Verify(x => x.GetFullSeasonScheduleAsync(2024), Times.Once);
        _mockCache.Verify(x => x.SetAsync("fullSchedule_2024", It.IsAny<List<ScheduleGame>>(), It.IsAny<DateTime>()), Times.Once);
    }

    [Fact]
    public async Task GetFullSeasonScheduleAsync_UsesLongExpiration_ForPastSeasons()
    {
        var pastSeason = DateTime.Now.Year - 1;
        var apiData = new List<ScheduleGame>();

        _mockCache.Setup(x => x.GetAsync<List<ScheduleGame>>($"fullSchedule_{pastSeason}"))
            .ReturnsAsync((List<ScheduleGame>?)null);
        _mockInnerService.Setup(x => x.GetFullSeasonScheduleAsync(pastSeason))
            .ReturnsAsync(apiData);

        DateTime capturedExpiration = default;
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<List<ScheduleGame>>(), It.IsAny<DateTime>()))
            .Callback<string, List<ScheduleGame>, DateTime>((_, _, exp) => capturedExpiration = exp)
            .ReturnsAsync(true);

        await _service.GetFullSeasonScheduleAsync(pastSeason);

        var daysUntilExpiration = (capturedExpiration - DateTime.UtcNow).TotalDays;
        Assert.True(daysUntilExpiration > 300);
    }

    [Fact]
    public async Task GetFullSeasonScheduleAsync_UsesShortExpiration_ForCurrentSeason()
    {
        var currentSeason = DateTime.Now.Year;
        var apiData = new List<ScheduleGame>();

        _mockCache.Setup(x => x.GetAsync<List<ScheduleGame>>($"fullSchedule_{currentSeason}"))
            .ReturnsAsync((List<ScheduleGame>?)null);
        _mockInnerService.Setup(x => x.GetFullSeasonScheduleAsync(currentSeason))
            .ReturnsAsync(apiData);

        DateTime capturedExpiration = default;
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<List<ScheduleGame>>(), It.IsAny<DateTime>()))
            .Callback<string, List<ScheduleGame>, DateTime>((_, _, exp) => capturedExpiration = exp)
            .ReturnsAsync(true);

        await _service.GetFullSeasonScheduleAsync(currentSeason);

        var hoursUntilExpiration = (capturedExpiration - DateTime.UtcNow).TotalHours;
        Assert.True(hoursUntilExpiration <= 144);
    }

    [Fact]
    public async Task GetAdvancedGameStatsAsync_ReturnsCachedData_WhenCacheHit()
    {
        var cachedData = new List<AdvancedGameStats>
        {
            new AdvancedGameStats
            {
                GameID = 12345,
                Team = "Alabama",
                Opponent = "Georgia",
                Week = 5,
                Offense = new AdvancedGameStatsUnit { Plays = 70, PPA = 0.25 },
                Defense = new AdvancedGameStatsUnit { Plays = 65, PPA = -0.15 }
            }
        };

        _mockCache.Setup(x => x.GetAsync<List<AdvancedGameStats>>("advancedGameStats_2024_regular"))
            .ReturnsAsync(cachedData);

        var result = await _service.GetAdvancedGameStatsAsync(2024, "regular");

        Assert.Single(result);
        Assert.Equal("Alabama", result.First().Team);
        _mockInnerService.Verify(x => x.GetAdvancedGameStatsAsync(It.IsAny<int>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task GetAdvancedGameStatsAsync_FetchesFromInnerService_WhenCacheMiss()
    {
        var apiData = new List<AdvancedGameStats>
        {
            new AdvancedGameStats
            {
                GameID = 12345,
                Team = "Ohio State",
                Opponent = "Michigan",
                Week = 12,
                Offense = new AdvancedGameStatsUnit { Plays = 68, PPA = 0.30 },
                Defense = new AdvancedGameStatsUnit { Plays = 62, PPA = -0.20 }
            }
        };

        _mockCache.Setup(x => x.GetAsync<List<AdvancedGameStats>>("advancedGameStats_2024_regular"))
            .ReturnsAsync((List<AdvancedGameStats>?)null);
        _mockInnerService.Setup(x => x.GetAdvancedGameStatsAsync(2024, "regular"))
            .ReturnsAsync(apiData);

        var result = await _service.GetAdvancedGameStatsAsync(2024, "regular");

        Assert.Single(result);
        Assert.Equal("Ohio State", result.First().Team);
        _mockInnerService.Verify(x => x.GetAdvancedGameStatsAsync(2024, "regular"), Times.Once);
        _mockCache.Verify(x => x.SetAsync("advancedGameStats_2024_regular", It.IsAny<List<AdvancedGameStats>>(), It.IsAny<DateTime>()), Times.Once);
    }

    [Fact]
    public async Task GetAdvancedGameStatsAsync_UsesLongExpiration_ForPastSeasons()
    {
        var pastSeason = DateTime.Now.Year - 1;
        var apiData = new List<AdvancedGameStats>();

        _mockCache.Setup(x => x.GetAsync<List<AdvancedGameStats>>($"advancedGameStats_{pastSeason}_regular"))
            .ReturnsAsync((List<AdvancedGameStats>?)null);
        _mockInnerService.Setup(x => x.GetAdvancedGameStatsAsync(pastSeason, "regular"))
            .ReturnsAsync(apiData);

        DateTime capturedExpiration = default;
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<List<AdvancedGameStats>>(), It.IsAny<DateTime>()))
            .Callback<string, List<AdvancedGameStats>, DateTime>((_, _, exp) => capturedExpiration = exp)
            .ReturnsAsync(true);

        await _service.GetAdvancedGameStatsAsync(pastSeason, "regular");

        var daysUntilExpiration = (capturedExpiration - DateTime.UtcNow).TotalDays;
        Assert.True(daysUntilExpiration > 300);
    }

    [Fact]
    public async Task GetAdvancedGameStatsAsync_UsesShortExpiration_ForCurrentSeason()
    {
        var currentSeason = DateTime.Now.Year;
        var apiData = new List<AdvancedGameStats>();

        _mockCache.Setup(x => x.GetAsync<List<AdvancedGameStats>>($"advancedGameStats_{currentSeason}_postseason"))
            .ReturnsAsync((List<AdvancedGameStats>?)null);
        _mockInnerService.Setup(x => x.GetAdvancedGameStatsAsync(currentSeason, "postseason"))
            .ReturnsAsync(apiData);

        DateTime capturedExpiration = default;
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<List<AdvancedGameStats>>(), It.IsAny<DateTime>()))
            .Callback<string, List<AdvancedGameStats>, DateTime>((_, _, exp) => capturedExpiration = exp)
            .ReturnsAsync(true);

        await _service.GetAdvancedGameStatsAsync(currentSeason, "postseason");

        var hoursUntilExpiration = (capturedExpiration - DateTime.UtcNow).TotalHours;
        Assert.True(hoursUntilExpiration <= 24);
    }

    [Fact]
    public async Task GetAdvancedGameStatsAsync_UsesDifferentCacheKeys_ForDifferentSeasonTypes()
    {
        var apiData = new List<AdvancedGameStats>();

        _mockCache.Setup(x => x.GetAsync<List<AdvancedGameStats>>(It.IsAny<string>()))
            .ReturnsAsync((List<AdvancedGameStats>?)null);
        _mockInnerService.Setup(x => x.GetAdvancedGameStatsAsync(2024, It.IsAny<string>()))
            .ReturnsAsync(apiData);

        await _service.GetAdvancedGameStatsAsync(2024, "regular");
        await _service.GetAdvancedGameStatsAsync(2024, "postseason");

        _mockCache.Verify(x => x.GetAsync<List<AdvancedGameStats>>("advancedGameStats_2024_regular"), Times.Once);
        _mockCache.Verify(x => x.GetAsync<List<AdvancedGameStats>>("advancedGameStats_2024_postseason"), Times.Once);
    }
}
