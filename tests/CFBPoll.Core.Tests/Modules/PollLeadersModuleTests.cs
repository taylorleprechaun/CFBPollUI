using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class PollLeadersModuleTests
{
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<ILogger<PollLeadersModule>> _mockLogger;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly PollLeadersModule _module;

    public PollLeadersModuleTests()
    {
        _mockDataService = new Mock<ICFBDataService>();
        _mockLogger = new Mock<ILogger<PollLeadersModule>>();
        _mockRankingsModule = new Mock<IRankingsModule>();

        _module = new PollLeadersModule(
            _mockDataService.Object,
            _mockRankingsModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public void Constructor_NullDataService_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new PollLeadersModule(
                null!,
                new Mock<IRankingsModule>().Object,
                new Mock<ILogger<PollLeadersModule>>().Object));
    }

    [Fact]
    public void Constructor_NullRankingsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new PollLeadersModule(
                new Mock<ICFBDataService>().Object,
                null!,
                new Mock<ILogger<PollLeadersModule>>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new PollLeadersModule(
                new Mock<ICFBDataService>().Object,
                new Mock<IRankingsModule>().Object,
                null!));
    }

    [Fact]
    public async Task GetPollLeadersAsync_NoPublishedSnapshots_ReturnsEmptyResult()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>());

        var result = await _module.GetPollLeadersAsync(null, null);

        Assert.Empty(result.AllWeeks);
        Assert.Empty(result.FinalWeeksOnly);
        Assert.Equal(0, result.MinAvailableSeason);
        Assert.Equal(0, result.MaxAvailableSeason);
    }

    [Fact]
    public async Task GetPollLeadersAsync_SkipsUnpublishedSnapshots()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 1, Published = false },
                new() { Season = 2023, Week = 2, Published = false }
            });

        var result = await _module.GetPollLeadersAsync(null, null);

        Assert.Empty(result.AllWeeks);
        Assert.Empty(result.FinalWeeksOnly);
        _mockRankingsModule.Verify(
            x => x.GetPublishedSnapshotAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetPollLeadersAsync_AllWeeks_CountsAppearancesAcrossMultipleSnapshots()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 1, Published = true },
                new() { Season = 2023, Week = 2, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 1, SeasonType = "regular" },
                new() { Week = 2, SeasonType = "regular" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 1))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 1,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Alabama", 3, "https://example.com/alabama.png"),
                    CreateTeam("Ohio State", 8, "https://example.com/ohiostate.png")
                }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 2))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 2,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Alabama", 3, "https://example.com/alabama.png"),
                    CreateTeam("Ohio State", 12, "https://example.com/ohiostate.png")
                }
            });

        var result = await _module.GetPollLeadersAsync(null, null);

        var allWeeks = result.AllWeeks.ToList();
        var alabama = allWeeks.First(e => e.TeamName == "Alabama");
        Assert.Equal(2, alabama.Top25Count);
        Assert.Equal(2, alabama.Top10Count);
        Assert.Equal(2, alabama.Top5Count);

        var ohioState = allWeeks.First(e => e.TeamName == "Ohio State");
        Assert.Equal(2, ohioState.Top25Count);
        Assert.Equal(1, ohioState.Top10Count);
        Assert.Equal(0, ohioState.Top5Count);
    }

    [Fact]
    public async Task GetPollLeadersAsync_FinalWeeksOnly_CountsOnlyPostseasonSnapshots()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2022, Week = 3, Published = true },
                new() { Season = 2022, Week = 5, Published = true },
                new() { Season = 2023, Week = 4, Published = true },
                new() { Season = 2023, Week = 6, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2022))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 3, SeasonType = "regular" },
                new() { Week = 5, SeasonType = "postseason" }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 4, SeasonType = "regular" },
                new() { Week = 6, SeasonType = "postseason" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2022, 5))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2022,
                Week = 5,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Michigan", 1, "https://example.com/michigan.png"),
                    CreateTeam("Texas", 7, "https://example.com/texas.png")
                }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 6))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 6,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Michigan", 2, "https://example.com/michigan.png"),
                    CreateTeam("Oklahoma", 15, "https://example.com/oklahoma.png")
                }
            });

        var result = await _module.GetPollLeadersAsync(null, null);

        var finalWeeks = result.FinalWeeksOnly.ToList();
        var michigan = finalWeeks.First(e => e.TeamName == "Michigan");
        Assert.Equal(2, michigan.Top25Count);
        Assert.Equal(2, michigan.Top10Count);
        Assert.Equal(2, michigan.Top5Count);

        var texas = finalWeeks.First(e => e.TeamName == "Texas");
        Assert.Equal(1, texas.Top25Count);
        Assert.Equal(1, texas.Top10Count);
        Assert.Equal(0, texas.Top5Count);

        var oklahoma = finalWeeks.First(e => e.TeamName == "Oklahoma");
        Assert.Equal(1, oklahoma.Top25Count);
        Assert.Equal(0, oklahoma.Top10Count);
        Assert.Equal(0, oklahoma.Top5Count);
    }

    [Fact]
    public async Task GetPollLeadersAsync_YearRangeFilter_RespectsMinMaxParams()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2021, Week = 5, Published = true },
                new() { Season = 2022, Week = 5, Published = true },
                new() { Season = 2023, Week = 5, Published = true }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2022, 5))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2022,
                Week = 5,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Florida", 1, "https://example.com/florida.png")
                }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2022))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 5, SeasonType = "postseason" }
            });

        var result = await _module.GetPollLeadersAsync(2022, 2022);

        var allWeeks = result.AllWeeks.ToList();
        Assert.Single(allWeeks);
        Assert.Equal("Florida", allWeeks[0].TeamName);

        _mockRankingsModule.Verify(
            x => x.GetPublishedSnapshotAsync(2021, It.IsAny<int>()), Times.Never);
        _mockRankingsModule.Verify(
            x => x.GetPublishedSnapshotAsync(2023, It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetPollLeadersAsync_AvailableSeasonBounds_ReportsFromAllPublishedData()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2020, Week = 5, Published = true },
                new() { Season = 2021, Week = 5, Published = true },
                new() { Season = 2022, Week = 5, Published = true },
                new() { Season = 2023, Week = 5, Published = true }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2022, 5))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2022,
                Week = 5,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Nebraska", 10, "https://example.com/nebraska.png")
                }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2022))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 5, SeasonType = "postseason" }
            });

        var result = await _module.GetPollLeadersAsync(2022, 2022);

        Assert.Equal(2020, result.MinAvailableSeason);
        Assert.Equal(2023, result.MaxAvailableSeason);
    }

    [Fact]
    public async Task GetPollLeadersAsync_FinalWeeksOnly_SkipsSeasonsWithNoPostseason()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 3, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 1, SeasonType = "regular" },
                new() { Week = 3, SeasonType = "regular" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 3))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 3,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Iowa", 1, "https://example.com/iowa.png")
                }
            });

        var result = await _module.GetPollLeadersAsync(null, null);

        Assert.Single(result.AllWeeks);
        Assert.Empty(result.FinalWeeksOnly);
    }

    [Fact]
    public async Task GetPollLeadersAsync_FinalWeeksOnly_SkipsSeasonsWithNoPublishedPostseasonSnapshot()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 3, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 5, SeasonType = "postseason" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 5))
            .ReturnsAsync((RankingsResult?)null);

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 3))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 3,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("USC", 1, "https://example.com/usc.png")
                }
            });

        var result = await _module.GetPollLeadersAsync(null, null);

        Assert.Single(result.AllWeeks);
        Assert.Empty(result.FinalWeeksOnly);
    }

    [Fact]
    public async Task GetPollLeadersAsync_TeamsOutsideTop25_ExcludedFromResults()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 1, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 1, SeasonType = "postseason" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 1))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 1,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Alabama", 5, "https://example.com/alabama.png"),
                    CreateTeam("Notre Dame", 26, "https://example.com/notredame.png"),
                    CreateTeam("Texas", 50, "https://example.com/texas.png")
                }
            });

        var result = await _module.GetPollLeadersAsync(null, null);

        var allWeeks = result.AllWeeks.ToList();
        Assert.Single(allWeeks);
        Assert.Equal("Alabama", allWeeks[0].TeamName);

        var finalWeeks = result.FinalWeeksOnly.ToList();
        Assert.Single(finalWeeks);
        Assert.Equal("Alabama", finalWeeks[0].TeamName);
    }

    [Fact]
    public async Task GetPollLeadersAsync_AllWeeks_RankThresholdsCounted()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 1, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 1, SeasonType = "postseason" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 1))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 1,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Alabama", 1, "https://example.com/alabama.png"),
                    CreateTeam("Ohio State", 5, "https://example.com/ohiostate.png"),
                    CreateTeam("Michigan", 10, "https://example.com/michigan.png"),
                    CreateTeam("Texas", 25, "https://example.com/texas.png")
                }
            });

        var result = await _module.GetPollLeadersAsync(null, null);

        var allWeeks = result.AllWeeks.ToList();

        var alabama = allWeeks.First(e => e.TeamName == "Alabama");
        Assert.Equal(1, alabama.Top5Count);
        Assert.Equal(1, alabama.Top10Count);
        Assert.Equal(1, alabama.Top25Count);

        var ohioState = allWeeks.First(e => e.TeamName == "Ohio State");
        Assert.Equal(1, ohioState.Top5Count);
        Assert.Equal(1, ohioState.Top10Count);
        Assert.Equal(1, ohioState.Top25Count);

        var michigan = allWeeks.First(e => e.TeamName == "Michigan");
        Assert.Equal(0, michigan.Top5Count);
        Assert.Equal(1, michigan.Top10Count);
        Assert.Equal(1, michigan.Top25Count);

        var texas = allWeeks.First(e => e.TeamName == "Texas");
        Assert.Equal(0, texas.Top5Count);
        Assert.Equal(0, texas.Top10Count);
        Assert.Equal(1, texas.Top25Count);
    }

    [Fact]
    public async Task GetPollLeadersAsync_NullSnapshotFromAllWeeks_SkipsGracefully()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 1, Published = true },
                new() { Season = 2023, Week = 2, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 1, SeasonType = "regular" },
                new() { Week = 2, SeasonType = "regular" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 1))
            .ReturnsAsync((RankingsResult?)null);

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 2))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 2,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Oklahoma", 1, "https://example.com/oklahoma.png")
                }
            });

        var result = await _module.GetPollLeadersAsync(null, null);

        var allWeeks = result.AllWeeks.ToList();
        Assert.Single(allWeeks);
        Assert.Equal("Oklahoma", allWeeks[0].TeamName);
    }

    [Fact]
    public async Task GetPollLeadersAsync_MinSeasonOnly_FiltersFromMin()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2020, Week = 1, Published = true },
                new() { Season = 2021, Week = 1, Published = true },
                new() { Season = 2022, Week = 1, Published = true }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2021, 1))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2021,
                Week = 1,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Florida", 1, "https://example.com/florida.png")
                }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2022, 1))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2022,
                Week = 1,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Florida", 2, "https://example.com/florida.png")
                }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(It.IsAny<int>()))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 1, SeasonType = "postseason" }
            });

        var result = await _module.GetPollLeadersAsync(2021, null);

        var allWeeks = result.AllWeeks.ToList();
        Assert.Single(allWeeks);
        Assert.Equal("Florida", allWeeks[0].TeamName);
        Assert.Equal(2, allWeeks[0].Top25Count);

        _mockRankingsModule.Verify(
            x => x.GetPublishedSnapshotAsync(2020, It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetPollLeadersAsync_MaxSeasonOnly_FiltersToMax()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2020, Week = 1, Published = true },
                new() { Season = 2021, Week = 1, Published = true },
                new() { Season = 2022, Week = 1, Published = true }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2020, 1))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2020,
                Week = 1,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Nebraska", 3, "https://example.com/nebraska.png")
                }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2021, 1))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2021,
                Week = 1,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Nebraska", 4, "https://example.com/nebraska.png")
                }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(It.IsAny<int>()))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 1, SeasonType = "postseason" }
            });

        var result = await _module.GetPollLeadersAsync(null, 2021);

        var allWeeks = result.AllWeeks.ToList();
        Assert.Single(allWeeks);
        Assert.Equal("Nebraska", allWeeks[0].TeamName);
        Assert.Equal(2, allWeeks[0].Top25Count);

        _mockRankingsModule.Verify(
            x => x.GetPublishedSnapshotAsync(2022, It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetPollLeadersAsync_MapsLogoURL()
    {
        SetupSinglePublishedWeek(2023, 1, "postseason",
            CreateTeam("USC", 1, "https://example.com/usc.png"));

        var result = await _module.GetPollLeadersAsync(null, null);

        var entry = result.AllWeeks.First();
        Assert.Equal("https://example.com/usc.png", entry.LogoURL);
    }

    [Fact]
    public async Task GetPollLeadersAsync_AllWeeks_OrderedByTop25ThenTop10ThenTop5()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 1, Published = true },
                new() { Season = 2023, Week = 2, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 1, SeasonType = "regular" },
                new() { Week = 2, SeasonType = "postseason" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 1))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 1,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Alabama", 1, "https://example.com/alabama.png"),
                    CreateTeam("Ohio State", 20, "https://example.com/ohiostate.png"),
                    CreateTeam("Michigan", 6, "https://example.com/michigan.png")
                }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 2))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 2,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Alabama", 2, "https://example.com/alabama.png"),
                    CreateTeam("Ohio State", 15, "https://example.com/ohiostate.png"),
                    CreateTeam("Michigan", 3, "https://example.com/michigan.png")
                }
            });

        var result = await _module.GetPollLeadersAsync(null, null);

        var allWeeks = result.AllWeeks.ToList();
        Assert.Equal(3, allWeeks.Count);
        Assert.Equal("Alabama", allWeeks[0].TeamName);
        Assert.Equal("Michigan", allWeeks[1].TeamName);
        Assert.Equal("Ohio State", allWeeks[2].TeamName);
    }

    [Fact]
    public async Task GetPollLeadersAsync_MixedPublishedAndUnpublished_OnlyCountsPublished()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 1, Published = true },
                new() { Season = 2023, Week = 2, Published = false },
                new() { Season = 2023, Week = 3, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 3, SeasonType = "postseason" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 1))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 1,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Iowa", 1, "https://example.com/iowa.png")
                }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 3))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 3,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Iowa", 2, "https://example.com/iowa.png")
                }
            });

        var result = await _module.GetPollLeadersAsync(null, null);

        var allWeeks = result.AllWeeks.ToList();
        Assert.Single(allWeeks);
        Assert.Equal("Iowa", allWeeks[0].TeamName);
        Assert.Equal(2, allWeeks[0].Top25Count);
    }

    private void SetupSinglePublishedWeek(
        int season, int week, string seasonType, params RankedTeam[] teams)
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = season, Week = week, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(season))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = week, SeasonType = seasonType }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(season, week))
            .ReturnsAsync(new RankingsResult
            {
                Season = season,
                Week = week,
                Rankings = teams.ToList()
            });
    }

    private static RankedTeam CreateTeam(string name, int rank, string logoURL)
    {
        return new RankedTeam
        {
            Conference = "Test Conference",
            Details = new TeamDetails(),
            Division = "Test Division",
            LogoURL = logoURL,
            Losses = 0,
            Rank = rank,
            Rating = 50.0,
            RatingComponents = new Dictionary<string, double>(),
            SOSRanking = rank,
            TeamName = name,
            WeightedSOS = 0.5,
            Wins = 10
        };
    }
}
