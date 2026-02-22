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
    public async Task GetFBSTeamsAsync_ReturnsCachedData_WhenCacheHit()
    {
        var cachedData = new List<FBSTeam>
        {
            new FBSTeam { Name = "Alabama", Conference = "SEC" }
        };

        _mockCache.Setup(x => x.GetAsync<List<FBSTeam>>("teams_2024"))
            .ReturnsAsync(cachedData);

        var result = await _service.GetFBSTeamsAsync(2024);

        Assert.Single(result);
        Assert.Equal("Alabama", result.First().Name);
        _mockInnerService.Verify(x => x.GetFBSTeamsAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetFBSTeamsAsync_FetchesFromInnerService_WhenCacheMiss()
    {
        var apiData = new List<FBSTeam>
        {
            new FBSTeam { Name = "Ohio State", Conference = "Big Ten" }
        };

        _mockCache.Setup(x => x.GetAsync<List<FBSTeam>>("teams_2024"))
            .ReturnsAsync((List<FBSTeam>?)null);
        _mockInnerService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync(apiData);

        var result = await _service.GetFBSTeamsAsync(2024);

        Assert.Single(result);
        _mockInnerService.Verify(x => x.GetFBSTeamsAsync(2024), Times.Once);
        _mockCache.Verify(x => x.SetAsync("teams_2024", It.IsAny<List<FBSTeam>>(), It.IsAny<DateTime>()), Times.Once);
    }

    [Fact]
    public async Task GetGamesAsync_ReturnsCachedData_WhenCacheHit()
    {
        var cachedData = new List<Game>
        {
            new Game { GameID = 1, HomeTeam = "Alabama", AwayTeam = "Florida", HomePoints = 28, AwayPoints = 24 }
        };

        _mockCache.Setup(x => x.GetAsync<List<Game>>("games_2024_regular"))
            .ReturnsAsync(cachedData);

        var result = await _service.GetGamesAsync(2024, "regular");

        Assert.Single(result);
        _mockInnerService.Verify(x => x.GetGamesAsync(It.IsAny<int>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task GetGamesAsync_FetchesFromInnerService_WhenCacheMiss()
    {
        var apiData = new List<Game>
        {
            new Game { GameID = 1, HomeTeam = "Ohio State", AwayTeam = "Michigan", HomePoints = 42, AwayPoints = 35 }
        };

        _mockCache.Setup(x => x.GetAsync<List<Game>>("games_2024_regular"))
            .ReturnsAsync((List<Game>?)null);
        _mockInnerService.Setup(x => x.GetGamesAsync(2024, "regular"))
            .ReturnsAsync(apiData);

        var result = await _service.GetGamesAsync(2024, "regular");

        Assert.Single(result);
        _mockInnerService.Verify(x => x.GetGamesAsync(2024, "regular"), Times.Once);
        _mockCache.Verify(x => x.SetAsync("games_2024_regular", It.IsAny<List<Game>>(), It.IsAny<DateTime>()), Times.Once);
    }

    [Fact]
    public async Task GetGamesAsync_UsesDifferentCacheKeys_ForDifferentSeasonTypes()
    {
        _mockCache.Setup(x => x.GetAsync<List<Game>>(It.IsAny<string>()))
            .ReturnsAsync((List<Game>?)null);
        _mockInnerService.Setup(x => x.GetGamesAsync(2024, It.IsAny<string>()))
            .ReturnsAsync(new List<Game>());

        await _service.GetGamesAsync(2024, "regular");
        await _service.GetGamesAsync(2024, "postseason");

        _mockCache.Verify(x => x.GetAsync<List<Game>>("games_2024_regular"), Times.Once);
        _mockCache.Verify(x => x.GetAsync<List<Game>>("games_2024_postseason"), Times.Once);
    }

    [Fact]
    public async Task GetSeasonTeamStatsAsync_ReturnsCachedData_WhenCacheHit()
    {
        var cachedData = new Dictionary<string, List<TeamStat>>
        {
            ["Alabama"] = [new TeamStat { StatName = "rushingYards", StatValue = new StatValue { Double = 250.0 } }]
        };

        _mockCache.Setup(x => x.GetAsync<Dictionary<string, List<TeamStat>>>("seasonStats_2024_week_5"))
            .ReturnsAsync(cachedData);

        var result = await _service.GetSeasonTeamStatsAsync(2024, 5);

        Assert.Single(result);
        _mockInnerService.Verify(x => x.GetSeasonTeamStatsAsync(It.IsAny<int>(), It.IsAny<int?>()), Times.Never);
    }

    [Fact]
    public async Task GetSeasonTeamStatsAsync_FetchesFromInnerService_WhenCacheMiss()
    {
        var apiData = new Dictionary<string, IEnumerable<TeamStat>>
        {
            ["Ohio State"] = new List<TeamStat> { new TeamStat { StatName = "passingYards", StatValue = new StatValue { Double = 300.0 } } }
        };

        _mockCache.Setup(x => x.GetAsync<Dictionary<string, List<TeamStat>>>("seasonStats_2024_week_5"))
            .ReturnsAsync((Dictionary<string, List<TeamStat>>?)null);
        _mockInnerService.Setup(x => x.GetSeasonTeamStatsAsync(2024, 5))
            .ReturnsAsync(apiData);

        var result = await _service.GetSeasonTeamStatsAsync(2024, 5);

        Assert.Single(result);
        _mockInnerService.Verify(x => x.GetSeasonTeamStatsAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task GetSeasonTeamStatsAsync_UsesCorrectKey_WhenEndWeekIsNull()
    {
        _mockCache.Setup(x => x.GetAsync<Dictionary<string, List<TeamStat>>>("seasonStats_2024"))
            .ReturnsAsync((Dictionary<string, List<TeamStat>>?)null);
        _mockInnerService.Setup(x => x.GetSeasonTeamStatsAsync(2024, null))
            .ReturnsAsync(new Dictionary<string, IEnumerable<TeamStat>>());

        await _service.GetSeasonTeamStatsAsync(2024, null);

        _mockCache.Verify(x => x.GetAsync<Dictionary<string, List<TeamStat>>>("seasonStats_2024"), Times.Once);
    }

    [Fact]
    public async Task GetSeasonDataAsync_FetchesComponentsIndividually()
    {
        SetupComponentMocks(2024, 5);

        var result = await _service.GetSeasonDataAsync(2024, 5);

        Assert.Equal(2024, result.Season);
        Assert.Equal(5, result.Week);

        _mockInnerService.Verify(x => x.GetFBSTeamsAsync(2024), Times.Once);
        _mockInnerService.Verify(x => x.GetGamesAsync(2024, "regular"), Times.Once);
        _mockInnerService.Verify(x => x.GetGamesAsync(2024, "postseason"), Times.Once);
        _mockInnerService.Verify(x => x.GetAdvancedGameStatsAsync(2024, "regular"), Times.Once);
    }

    [Fact]
    public async Task GetSeasonDataAsync_DoesNotCacheAssembledResult()
    {
        SetupComponentMocks(2024, 5);

        await _service.GetSeasonDataAsync(2024, 5);

        _mockCache.Verify(x => x.SetAsync(It.Is<string>(k => k.StartsWith("seasonData_")), It.IsAny<SeasonData>(), It.IsAny<DateTime>()), Times.Never);
    }

    [Fact]
    public async Task GetSeasonDataAsync_FetchesPostseasonAdvancedStats_WhenWeekExceedsMaxRegular()
    {
        var teams = new List<FBSTeam> { new FBSTeam { Name = "Alabama" } };
        var regularGames = new List<Game>
        {
            new Game { GameID = 1, Week = 1, HomeTeam = "Alabama", AwayTeam = "Florida", HomePoints = 28, AwayPoints = 24, SeasonType = "regular" }
        };
        var postseasonGames = new List<Game>
        {
            new Game { GameID = 2, Week = 16, HomeTeam = "Alabama", AwayTeam = "Ohio State", HomePoints = 35, AwayPoints = 28, SeasonType = "postseason" }
        };

        SetupCacheMiss();
        _mockInnerService.Setup(x => x.GetFBSTeamsAsync(2024)).ReturnsAsync(teams);
        _mockInnerService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync(regularGames);
        _mockInnerService.Setup(x => x.GetGamesAsync(2024, "postseason")).ReturnsAsync(postseasonGames);
        _mockInnerService.Setup(x => x.GetAdvancedGameStatsAsync(2024, It.IsAny<string>())).ReturnsAsync(new List<AdvancedGameStats>());
        _mockInnerService.Setup(x => x.GetSeasonTeamStatsAsync(2024, It.IsAny<int?>())).ReturnsAsync(new Dictionary<string, IEnumerable<TeamStat>>());

        await _service.GetSeasonDataAsync(2024, 16);

        _mockInnerService.Verify(x => x.GetAdvancedGameStatsAsync(2024, "postseason"), Times.Once);
    }

    [Fact]
    public async Task GetSeasonDataAsync_DoesNotFetchPostseasonAdvancedStats_WhenWeekIsRegular()
    {
        SetupComponentMocks(2024, 5);

        await _service.GetSeasonDataAsync(2024, 5);

        _mockInnerService.Verify(x => x.GetAdvancedGameStatsAsync(2024, "postseason"), Times.Never);
    }

    [Fact]
    public async Task GetSeasonDataAsync_AssemblesTeamsCorrectly()
    {
        var teams = new List<FBSTeam>
        {
            new FBSTeam { Name = "Alabama", Conference = "SEC", Color = "#9E1B32" },
            new FBSTeam { Name = "Florida", Conference = "SEC", Color = "#BA0C2F" }
        };
        var regularGames = new List<Game>
        {
            new Game { GameID = 1, Week = 1, HomeTeam = "Alabama", AwayTeam = "Florida", HomePoints = 28, AwayPoints = 24, SeasonType = "regular" }
        };

        SetupCacheMiss();
        _mockInnerService.Setup(x => x.GetFBSTeamsAsync(2024)).ReturnsAsync(teams);
        _mockInnerService.Setup(x => x.GetGamesAsync(2024, "regular")).ReturnsAsync(regularGames);
        _mockInnerService.Setup(x => x.GetGamesAsync(2024, "postseason")).ReturnsAsync(new List<Game>());
        _mockInnerService.Setup(x => x.GetAdvancedGameStatsAsync(2024, "regular")).ReturnsAsync(new List<AdvancedGameStats>());
        _mockInnerService.Setup(x => x.GetSeasonTeamStatsAsync(2024, 5)).ReturnsAsync(new Dictionary<string, IEnumerable<TeamStat>>());

        var result = await _service.GetSeasonDataAsync(2024, 5);

        Assert.Equal(2, result.Teams.Count);
        Assert.Equal(1, result.Teams["Alabama"].Wins);
        Assert.Equal(1, result.Teams["Florida"].Losses);
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
                AwayTeam = "Florida",
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
                Opponent = "Florida",
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

    private void SetupCacheMiss()
    {
        _mockCache.Setup(x => x.GetAsync<List<FBSTeam>>(It.IsAny<string>())).ReturnsAsync((List<FBSTeam>?)null);
        _mockCache.Setup(x => x.GetAsync<List<Game>>(It.IsAny<string>())).ReturnsAsync((List<Game>?)null);
        _mockCache.Setup(x => x.GetAsync<List<AdvancedGameStats>>(It.IsAny<string>())).ReturnsAsync((List<AdvancedGameStats>?)null);
        _mockCache.Setup(x => x.GetAsync<Dictionary<string, List<TeamStat>>>(It.IsAny<string>())).ReturnsAsync((Dictionary<string, List<TeamStat>>?)null);
    }

    private void SetupComponentMocks(int season, int week)
    {
        var teams = new List<FBSTeam> { new FBSTeam { Name = "Alabama", Conference = "SEC" } };
        var regularGames = new List<Game>
        {
            new Game { GameID = 1, Week = 1, HomeTeam = "Alabama", AwayTeam = "Florida", HomePoints = 28, AwayPoints = 24, SeasonType = "regular" },
            new Game { GameID = 2, Week = 10, HomeTeam = "Alabama", AwayTeam = "LSU", HomePoints = 35, AwayPoints = 21, SeasonType = "regular" }
        };
        var postseasonGames = new List<Game>();
        var advancedStats = new List<AdvancedGameStats>();
        var seasonStats = new Dictionary<string, IEnumerable<TeamStat>>();

        SetupCacheMiss();
        _mockInnerService.Setup(x => x.GetFBSTeamsAsync(season)).ReturnsAsync(teams);
        _mockInnerService.Setup(x => x.GetGamesAsync(season, "regular")).ReturnsAsync(regularGames);
        _mockInnerService.Setup(x => x.GetGamesAsync(season, "postseason")).ReturnsAsync(postseasonGames);
        _mockInnerService.Setup(x => x.GetAdvancedGameStatsAsync(season, "regular")).ReturnsAsync(advancedStats);
        _mockInnerService.Setup(x => x.GetSeasonTeamStatsAsync(season, week)).ReturnsAsync(seasonStats);
    }
}
