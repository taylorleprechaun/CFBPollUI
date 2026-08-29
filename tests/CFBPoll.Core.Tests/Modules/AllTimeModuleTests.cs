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
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AllTimeModule(
                new Mock<ICFBDataService>().Object,
                new Mock<IRankingsModule>().Object,
                null!));
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
    public async Task GetAllTimeRankingsAsync_BestTeams_ComputesZScorePerSeasonMeanAndStdDev()
    {
        // Ratings 50/40/30 -> mean 40.0, population stddev = sqrt(((10^2)+(0^2)+(-10^2))/3) = 8.164966
        var teams = new List<RankedTeam>
        {
            CreateTeam("Alabama", 50.0, 11, 1, 1, 0.8),
            CreateTeam("Florida", 40.0, 8, 4, 2, 0.6),
            CreateTeam("USC", 30.0, 5, 7, 3, 0.4)
        };

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        var bestTeams = result.BestTeams.ToList();
        Assert.Equal(1.2247, bestTeams.Single(e => e.TeamName == "Alabama").RatingZScore, precision: 4);
        Assert.Equal(0.0, bestTeams.Single(e => e.TeamName == "Florida").RatingZScore, precision: 4);
        Assert.Equal(-1.2247, bestTeams.Single(e => e.TeamName == "USC").RatingZScore, precision: 4);
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
    public async Task GetAllTimeRankingsAsync_BestTeams_SortedByRatingZScoreDescending()
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
    public async Task GetAllTimeRankingsAsync_BestTeams_ZeroStdDevSeason_DefaultsZScoreToZero()
    {
        var teams = new List<RankedTeam>
        {
            CreateTeam("Iowa", 40.0, 7, 5, 1, 0.5),
            CreateTeam("Nebraska", 40.0, 7, 5, 2, 0.5),
            CreateTeam("Michigan", 40.0, 7, 5, 3, 0.5)
        };

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.All(result.BestTeams, e => Assert.Equal(0.0, e.RatingZScore));
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_BestTeams_ZScoreSortDivergesFromRawRatingSortAcrossSeasons_SortsByZScore()
    {
        // Season 2022: ratings 60/58/56 -> mean 58, stddev 1.632993 -> "Ohio State" z = 2/1.632993 = 1.224745
        // Season 2023: ratings 45/20/10 -> mean 25, stddev 14.719601 -> "Iowa" z = 20/14.719601 = 1.358732
        // "Iowa" has a lower raw rating (45) than "Ohio State" (60), but Iowa's season was far less
        // spread out relative to its mean, so Iowa's z-score is higher -> Iowa should rank first.
        _mockRankingsModule
            .Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>
            {
                new() { Season = 2022, Week = 5, IsPublished = true },
                new() { Season = 2023, Week = 6, IsPublished = true }
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
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2022, 5))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2022,
                Week = 5,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Ohio State", 60.0, 13, 0, 1, 0.9),
                    CreateTeam("Michigan", 58.0, 12, 1, 2, 0.85),
                    CreateTeam("Notre Dame", 56.0, 11, 1, 3, 0.8)
                }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2023, 6))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 6,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Iowa", 45.0, 10, 3, 1, 0.6),
                    CreateTeam("Nebraska", 20.0, 5, 7, 2, 0.4),
                    CreateTeam("Texas", 10.0, 3, 9, 3, 0.3)
                }
            });

        var result = await _module.GetAllTimeRankingsAsync();

        var bestTeams = result.BestTeams.ToList();
        Assert.Equal("Iowa", bestTeams[0].TeamName);
        Assert.Equal("Ohio State", bestTeams[1].TeamName);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_DeduplicatesSeasonsFromMultipleWeeks()
    {
        _mockRankingsModule
            .Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>
            {
                new() { Season = 2023, Week = 3, IsPublished = true },
                new() { Season = 2023, Week = 5, IsPublished = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 5, SeasonType = "postseason" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2023, 5))
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
    public async Task GetAllTimeRankingsAsync_GetCalendarAsyncThrows_PropagatesException()
    {
        _mockRankingsModule
            .Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>
            {
                new() { Season = 2023, Week = 5, IsPublished = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ThrowsAsync(new InvalidOperationException("API unavailable"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _module.GetAllTimeRankingsAsync());
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_GetPublishedRankingsSnapshotAsyncThrows_PropagatesException()
    {
        _mockRankingsModule
            .Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>
            {
                new() { Season = 2023, Week = 5, IsPublished = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 5, SeasonType = "postseason" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2023, 5))
            .ThrowsAsync(new InvalidOperationException("RankingsSnapshot corrupted"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _module.GetAllTimeRankingsAsync());
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_GetRankingsSnapshotsThrows_PropagatesException()
    {
        _mockRankingsModule
            .Setup(x => x.GetRankingsSnapshotsAsync())
            .ThrowsAsync(new InvalidOperationException("Database unavailable"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _module.GetAllTimeRankingsAsync());
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
    public async Task GetAllTimeRankingsAsync_MapsLogoURLCorrectly()
    {
        SetupSingleSeason(2023, "postseason", CreateTeam("Team A", 50.0, 10, 0, 1, 0.8));

        var result = await _module.GetAllTimeRankingsAsync();

        var entry = result.BestTeams.First();
        Assert.Equal("https://example.com/Team A.png", entry.LogoURL);
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
    public async Task GetAllTimeRankingsAsync_MapsSeasonAndWeekCorrectly()
    {
        SetupSingleSeason(2023, "postseason", CreateTeam("Team A", 50.0, 10, 0, 1, 0.8));

        var result = await _module.GetAllTimeRankingsAsync();

        var entry = result.BestTeams.First();
        Assert.Equal(2023, entry.Season);
        Assert.Equal(5, entry.Week);
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
    public async Task GetAllTimeRankingsAsync_MultipleSeasonsWithDuplicateWeeks_CallsGetCalendarOncePerSeason()
    {
        _mockRankingsModule
            .Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>
            {
                new() { Season = 2022, Week = 3, IsPublished = true },
                new() { Season = 2022, Week = 5, IsPublished = true },
                new() { Season = 2023, Week = 6, IsPublished = true }
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
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2022, 5))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2022,
                Week = 5,
                Rankings = new List<RankedTeam> { CreateTeam("Team 2022", 50.0, 10, 0, 1, 0.8) }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2023, 6))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 6,
                Rankings = new List<RankedTeam> { CreateTeam("Team 2023", 55.0, 11, 0, 1, 0.9) }
            });

        await _module.GetAllTimeRankingsAsync();

        _mockDataService.Verify(x => x.GetCalendarAsync(2022), Times.Once);
        _mockDataService.Verify(x => x.GetCalendarAsync(2023), Times.Once);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_MultipleSeasons_CombinesData()
    {
        // 2022: ratings 50/48/20 -> mean 39.333, stddev 13.696 -> "Ohio State" z = 10.667/13.696 = 0.7788
        // 2023: ratings 55/54/53 -> mean 54.0, stddev 0.8165 -> "Michigan" z = 1/0.8165 = 1.2247
        // "Texas" (2022, rating 20) is the outlier furthest below its season's mean -> lowest z-score overall.
        _mockRankingsModule
            .Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>
            {
                new() { Season = 2022, Week = 5, IsPublished = true },
                new() { Season = 2023, Week = 6, IsPublished = true }
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
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2022, 5))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2022,
                Week = 5,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Ohio State", 50.0, 10, 0, 1, 0.8),
                    CreateTeam("Oklahoma", 48.0, 9, 1, 2, 0.75),
                    CreateTeam("Texas", 20.0, 4, 6, 3, 0.4)
                }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2023, 6))
            .ReturnsAsync(new RankingsResult
            {
                Season = 2023,
                Week = 6,
                Rankings = new List<RankedTeam>
                {
                    CreateTeam("Michigan", 55.0, 11, 0, 1, 0.9),
                    CreateTeam("Notre Dame", 54.0, 11, 1, 2, 0.85),
                    CreateTeam("Nebraska", 53.0, 10, 2, 3, 0.8)
                }
            });

        var result = await _module.GetAllTimeRankingsAsync();

        var bestTeams = result.BestTeams.ToList();
        Assert.Equal(6, bestTeams.Count);
        Assert.Equal("Michigan", bestTeams.First().TeamName);
        Assert.Equal(2023, bestTeams.First().Season);
        Assert.Equal("Texas", bestTeams.Last().TeamName);
        Assert.Equal(2022, bestTeams.Last().Season);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_NoPersistedWeeks_ReturnsEmptyLists()
    {
        _mockRankingsModule
            .Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>());

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Empty(result.BestTeams);
        Assert.Empty(result.WorstTeams);
        Assert.Empty(result.HardestSchedules);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_NoPostseasonInCalendar_SkipsSeason()
    {
        _mockRankingsModule
            .Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>
            {
                new() { Season = 2023, Week = 5, IsPublished = true }
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
    public async Task GetAllTimeRankingsAsync_NoPublishedPostseasonRankingsSnapshot_SkipsSeason()
    {
        _mockRankingsModule
            .Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>
            {
                new() { Season = 2023, Week = 5, IsPublished = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2023))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 5, SeasonType = "postseason" }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2023, 5))
            .ReturnsAsync((RankingsResult?)null);

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Empty(result.BestTeams);
        Assert.Empty(result.WorstTeams);
        Assert.Empty(result.HardestSchedules);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_OnlyDraftRankingsSnapshots_ReturnsEmptyLists()
    {
        _mockRankingsModule
            .Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>
            {
                new() { Season = 2023, Week = 1, IsPublished = false }
            });

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Empty(result.BestTeams);
        Assert.Empty(result.WorstTeams);
        Assert.Empty(result.HardestSchedules);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_PostseasonCaseInsensitive_FindsRankingsSnapshot()
    {
        SetupSingleSeason(2023, "Postseason", CreateTeam("Team A", 50.0, 5, 0, 1, 0.8));

        var result = await _module.GetAllTimeRankingsAsync();

        Assert.Single(result.BestTeams);
        Assert.Equal("Team A", result.BestTeams.First().TeamName);
    }

    [Fact]
    public async Task GetAllTimeRankingsAsync_WorstTeams_ComputesZScorePerSeasonMeanAndStdDev()
    {
        // Ratings 10/20/30 -> mean 20.0, population stddev = sqrt(((-10^2)+(0^2)+(10^2))/3) = 8.164966
        var teams = new List<RankedTeam>
        {
            CreateTeam("Texas", 10.0, 2, 8, 128, 0.2),
            CreateTeam("Nebraska", 20.0, 3, 7, 100, 0.3),
            CreateTeam("Oklahoma", 30.0, 4, 6, 75, 0.4)
        };

        SetupSingleSeason(2023, "postseason", teams.ToArray());

        var result = await _module.GetAllTimeRankingsAsync();

        var worstTeams = result.WorstTeams.ToList();
        Assert.Equal(-1.2247, worstTeams.Single(e => e.TeamName == "Texas").RatingZScore, precision: 4);
        Assert.Equal(0.0, worstTeams.Single(e => e.TeamName == "Nebraska").RatingZScore, precision: 4);
        Assert.Equal(1.2247, worstTeams.Single(e => e.TeamName == "Oklahoma").RatingZScore, precision: 4);
        Assert.Equal("Texas", worstTeams[0].TeamName);
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
    public async Task GetAllTimeRankingsAsync_WorstTeams_SortedByRatingZScoreAscending()
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

    private void SetupSingleSeason(int season, string seasonType, params RankedTeam[] teams)
    {
        _mockRankingsModule
            .Setup(x => x.GetRankingsSnapshotsAsync())
            .ReturnsAsync(new List<RankingsSnapshotSummary>
            {
                new() { Season = season, Week = 5, IsPublished = true }
            });

        _mockDataService
            .Setup(x => x.GetCalendarAsync(season))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new() { Week = 5, SeasonType = seasonType }
            });

        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(season, 5))
            .ReturnsAsync(new RankingsResult
            {
                Season = season,
                Week = 5,
                Rankings = teams.ToList()
            });
    }
}
