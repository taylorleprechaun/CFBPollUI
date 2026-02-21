using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class AllTimeModuleTests
{
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<ILogger<AllTimeModule>> _mockLogger;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly AllTimeModule _module;

    public AllTimeModuleTests()
    {
        _mockDataService = new Mock<ICFBDataService>();
        _mockLogger = new Mock<ILogger<AllTimeModule>>();
        _mockRankingsModule = new Mock<IRankingsModule>();

        _module = new AllTimeModule(
            _mockDataService.Object,
            _mockRankingsModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public void Constructor_NullDataService_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AllTimeModule(
                null!,
                new Mock<IRankingsModule>().Object,
                new Mock<ILogger<AllTimeModule>>().Object));
    }

    [Fact]
    public void Constructor_NullRankingsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AllTimeModule(
                new Mock<ICFBDataService>().Object,
                null!,
                new Mock<ILogger<AllTimeModule>>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AllTimeModule(
                new Mock<ICFBDataService>().Object,
                new Mock<IRankingsModule>().Object,
                null!));
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_NoPersistedWeeks_ReturnsEmptyLists()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>());

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Empty(result.BestTeams);
        Assert.Empty(result.WorstTeams);
        Assert.Empty(result.HardestSchedules);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_OnlyDraftSnapshots_ReturnsEmptyLists()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 1, Published = false }
            });

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Empty(result.BestTeams);
        Assert.Empty(result.WorstTeams);
        Assert.Empty(result.HardestSchedules);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_NoPostseasonInCalendar_SkipsSeason()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 5, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 1, SeasonType = "regular" },
                new() { Week = 5, SeasonType = "regular" }
            });

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Empty(result.BestTeams);
        Assert.Empty(result.WorstTeams);
        Assert.Empty(result.HardestSchedules);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_NoPublishedPostseasonSnapshot_SkipsSeason()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 5, Published = true }
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

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Empty(result.BestTeams);
        Assert.Empty(result.WorstTeams);
        Assert.Empty(result.HardestSchedules);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_PostseasonCaseInsensitive_FindsSnapshot()
    {
        SetupSingleSeason(2023, "Postseason", CreateTeam("Team A", 50.0, 5, 0, 1, 0.8));

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Single(result.BestTeams);
        Assert.Equal("Team A", result.BestTeams.First().TeamName);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_BestTeams_FiltersByThreshold()
    {
        var teams = Enumerable.Range(1, 26)
            .Select(i => CreateTeam($"Good {i}", 40.0 + i, 10, 0, i, 0.8))
            .ToList();
        teams.Add(CreateTeam("Low Team", 20.0, 5, 5, 50, 0.3));

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Equal(25, result.BestTeams.Count());
        Assert.DoesNotContain(result.BestTeams, e => e.TeamName == "Low Team");
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_BestTeams_FallsBackToTop25WhenBelowThreshold()
    {
        var teams = new List<RankedTeam>
        {
            CreateTeam("Team A", 35.0, 8, 2, 1, 0.6),
            CreateTeam("Team B", 30.0, 7, 3, 2, 0.5),
            CreateTeam("Team C", 25.0, 6, 4, 3, 0.4)
        };

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Equal(3, result.BestTeams.Count());
        Assert.Equal("Team A", result.BestTeams.First().TeamName);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_BestTeams_LimitedTo25()
    {
        var teams = Enumerable.Range(1, 30)
            .Select(i => CreateTeam($"Team {i}", 40.0 + i, 10, 0, i, 0.8))
            .ToList();

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Equal(25, result.BestTeams.Count());
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_BestTeams_SortedByRatingDescending()
    {
        var teams = new List<RankedTeam>
        {
            CreateTeam("Lower", 42.0, 9, 1, 2, 0.7),
            CreateTeam("Higher", 55.0, 11, 0, 1, 0.9),
            CreateTeam("Middle", 45.0, 10, 1, 3, 0.75)
        };

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        var bestTeams = result.BestTeams.ToList();
        Assert.Equal("Higher", bestTeams[0].TeamName);
        Assert.Equal("Middle", bestTeams[1].TeamName);
        Assert.Equal("Lower", bestTeams[2].TeamName);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_BestTeams_AssignsSequentialRanks()
    {
        var teams = new List<RankedTeam>
        {
            CreateTeam("Team A", 50.0, 10, 0, 1, 0.8),
            CreateTeam("Team B", 45.0, 9, 1, 2, 0.7),
            CreateTeam("Team C", 42.0, 8, 2, 3, 0.6)
        };

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        var bestTeams = result.BestTeams.ToList();
        Assert.Equal(1, bestTeams[0].AllTimeRank);
        Assert.Equal(2, bestTeams[1].AllTimeRank);
        Assert.Equal(3, bestTeams[2].AllTimeRank);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_WorstTeams_FiltersByThreshold()
    {
        var teams = Enumerable.Range(1, 26)
            .Select(i => CreateTeam($"Bad {i}", i * 0.5, 0, 10, 130 - i, 0.2))
            .ToList();
        teams.Add(CreateTeam("Good Team", 50.0, 10, 0, 1, 0.8));

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Equal(25, result.WorstTeams.Count());
        Assert.DoesNotContain(result.WorstTeams, e => e.TeamName == "Good Team");
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_WorstTeams_FallsBackToBottom25WhenAboveThreshold()
    {
        var teams = new List<RankedTeam>
        {
            CreateTeam("Team A", 20.0, 5, 5, 80, 0.4),
            CreateTeam("Team B", 25.0, 6, 4, 70, 0.45),
            CreateTeam("Team C", 30.0, 7, 3, 60, 0.5)
        };

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Equal(3, result.WorstTeams.Count());
        Assert.Equal("Team A", result.WorstTeams.First().TeamName);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_WorstTeams_SortedByRatingAscending()
    {
        var teams = new List<RankedTeam>
        {
            CreateTeam("Mid", 14.0, 2, 8, 125, 0.25),
            CreateTeam("Worst", 8.0, 0, 10, 130, 0.15),
            CreateTeam("Bad", 12.0, 1, 9, 128, 0.2)
        };

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        var worstTeams = result.WorstTeams.ToList();
        Assert.Equal("Worst", worstTeams[0].TeamName);
        Assert.Equal("Bad", worstTeams[1].TeamName);
        Assert.Equal("Mid", worstTeams[2].TeamName);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_WorstTeams_LimitedTo25()
    {
        var teams = Enumerable.Range(1, 30)
            .Select(i => CreateTeam($"Team {i}", i, 1, 9, 130 - i, 0.2))
            .ToList();

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Equal(25, result.WorstTeams.Count());
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_HardestSchedules_Top25ByWeightedSOS()
    {
        var teams = Enumerable.Range(1, 30)
            .Select(i => CreateTeam($"Team {i}", 30.0, 6, 4, i, 0.5 + (i * 0.01)))
            .ToList();

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Equal(25, result.HardestSchedules.Count());
        var schedules = result.HardestSchedules.ToList();
        Assert.True(schedules[0].WeightedSOS > schedules[1].WeightedSOS);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_HardestSchedules_SortedByWeightedSOSDescending()
    {
        var teams = new List<RankedTeam>
        {
            CreateTeam("Low SOS", 30.0, 6, 4, 5, 0.3),
            CreateTeam("High SOS", 30.0, 6, 4, 1, 0.9),
            CreateTeam("Mid SOS", 30.0, 6, 4, 3, 0.6)
        };

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        var schedules = result.HardestSchedules.ToList();
        Assert.Equal("High SOS", schedules[0].TeamName);
        Assert.Equal("Mid SOS", schedules[1].TeamName);
        Assert.Equal("Low SOS", schedules[2].TeamName);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_HardestSchedules_AssignsSequentialRanks()
    {
        var teams = new List<RankedTeam>
        {
            CreateTeam("Team A", 30.0, 6, 4, 1, 0.9),
            CreateTeam("Team B", 30.0, 6, 4, 2, 0.7),
            CreateTeam("Team C", 30.0, 6, 4, 3, 0.5)
        };

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        var schedules = result.HardestSchedules.ToList();
        Assert.Equal(1, schedules[0].AllTimeRank);
        Assert.Equal(2, schedules[1].AllTimeRank);
        Assert.Equal(3, schedules[2].AllTimeRank);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_MultipleSeasons_CombinesData()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2022, Week = 5, Published = true },
                new() { Season = 2023, Week = 6, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2022))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 5, SeasonType = "postseason" }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
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
                    CreateTeam("Team 2022", 50.0, 10, 0, 1, 0.8)
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
                    CreateTeam("Team 2023", 55.0, 11, 0, 1, 0.9)
                }
            });

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Equal(2, result.BestTeams.Count());
        Assert.Equal("Team 2023", result.BestTeams.First().TeamName);
        Assert.Equal(2023, result.BestTeams.First().Season);
        Assert.Equal("Team 2022", result.BestTeams.Last().TeamName);
        Assert.Equal(2022, result.BestTeams.Last().Season);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_DeduplicatesSeasonsFromMultipleWeeks()
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = 2023, Week = 3, Published = true },
                new() { Season = 2023, Week = 5, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 5, SeasonType = "postseason" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 5))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 5,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Team A", 50.0, 10, 0, 1, 0.8)
                }
            });

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Single(result.BestTeams);
        _mockDataService.Verify(x => x.GetCalendarAsync(2023), Times.Once);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_MapsSeasonAndWeekCorrectly()
    {
        SetupSingleSeason(2023, "postseason", CreateTeam("Team A", 50.0, 10, 0, 1, 0.8));

        var result = await _module.GetAllTimeRankingsAsync();

        var entry = result.BestTeams.First();
        Assert.Equal(2023, entry.Season);
        Assert.Equal(5, entry.Week);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_MapsRankCorrectly()
    {
        SetupSingleSeason(2023, "postseason", CreateTeam("Team A", 50.0, 10, 0, 3, 0.8));

        var result = await _module.GetAllTimeRankingsAsync();

        var entry = result.BestTeams.First();
        Assert.Equal(3, entry.Rank);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_MapsWinsAndLossesCorrectly()
    {
        SetupSingleSeason(2023, "postseason", CreateTeam("Team A", 50.0, 11, 2, 1, 0.8));

        var result = await _module.GetAllTimeRankingsAsync();

        var entry = result.BestTeams.First();
        Assert.Equal(11, entry.Wins);
        Assert.Equal(2, entry.Losses);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_MapsLogoURLCorrectly()
    {
        SetupSingleSeason(2023, "postseason", CreateTeam("Team A", 50.0, 10, 0, 1, 0.8));

        var result = await _module.GetAllTimeRankingsAsync();

        var entry = result.BestTeams.First();
        Assert.Equal("https://example.com/Team A.png", entry.LogoURL);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_WorstTeams_ExcludesZeroGameTeams()
    {
        var teams = new List<RankedTeam>
        {
            CreateTeam("No Games", 0.0, 0, 0, 130, 0.0),
            CreateTeam("Bad Team", 10.0, 1, 9, 125, 0.2),
            CreateTeam("Worse Team", 5.0, 0, 10, 128, 0.15)
        };

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Equal(2, result.WorstTeams.Count());
        Assert.DoesNotContain(result.WorstTeams, e => e.TeamName == "No Games");
        Assert.Equal("Worse Team", result.WorstTeams.First().TeamName);
    }

    private void SetupSingleSeason(int season, string seasonType, params RankedTeam[] teams)
    {
        _mockRankingsModule
            .Setup(x => x.GetPersistedWeeksAsync())
            .ReturnsAsync(new List<PersistedWeekSummary>
            {
                new() { Season = season, Week = 5, Published = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(season))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 5, SeasonType = seasonType }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(season, 5))
            .ReturnsAsync(new RankingsResult
            {
                Season = season,
                Week = 5,
                Rankings = teams.ToList()
            });
    }

    private static RankedTeam CreateTeam(
        string name, double rating, int wins, int losses, int rank, double weightedSOS)
    {
        return new RankedTeam
        {
            Conference = "Test Conference",
            Details = new TeamDetails(),
            Division = "Test Division",
            LogoURL = $"https://example.com/{name}.png",
            Losses = losses,
            Rank = rank,
            Rating = rating,
            RatingComponents = new Dictionary<string, double>(),
            SOSRanking = rank,
            TeamName = name,
            WeightedSOS = weightedSOS,
            Wins = wins
        };
    }
}
