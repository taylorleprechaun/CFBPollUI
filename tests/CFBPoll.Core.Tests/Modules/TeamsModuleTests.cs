using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class TeamsModuleTests
{
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<ILogger<TeamsModule>> _mockLogger;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<IRatingModule> _mockRatingModule;
    private readonly TeamsModule _teamsModule;

    public TeamsModuleTests()
    {
        _mockDataService = new Mock<ICFBDataService>();
        _mockLogger = new Mock<ILogger<TeamsModule>>();
        _mockRankingsModule = new Mock<IRankingsModule>();
        _mockRatingModule = new Mock<IRatingModule>();

        _teamsModule = new TeamsModule(
            _mockDataService.Object,
            _mockRankingsModule.Object,
            _mockRatingModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task GetTeamDetailAsync_TeamNotInSeasonData_ReturnsNull()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Alabama"] = new TeamInfo { Name = "Alabama", Games = [] }
            },
            Games = []
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);

        var result = await _teamsModule.GetTeamDetailAsync("NonExistentTeam", 2023, 5);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetTeamDetailAsync_TeamNotInRankings_ReturnsNull()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Georgia"] = new TeamInfo { Name = "Georgia", Games = [] }
            },
            Games = []
        };

        var rankingsResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Alabama", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);
        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync((RankingsResult?)null);

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Georgia"] = new RatingDetails { RatingComponents = new Dictionary<string, double>() }
        };

        _mockRatingModule.Setup(x => x.RateTeams(seasonData)).Returns(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);

        var result = await _teamsModule.GetTeamDetailAsync("Georgia", 2023, 5);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetTeamDetailAsync_PersistedSnapshot_UsesPersistedRankings()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Georgia"] = new TeamInfo { Name = "Georgia", Conference = "SEC", Games = [] }
            },
            Games = []
        };

        var persistedResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Georgia", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);
        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync(persistedResult);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2023)).ReturnsAsync(new List<ScheduleGame>());

        var result = await _teamsModule.GetTeamDetailAsync("Georgia", 2023, 5);

        Assert.NotNull(result);
        Assert.Equal("Georgia", result.RankedTeam.TeamName);
        _mockRatingModule.Verify(x => x.RateTeams(It.IsAny<SeasonData>()), Times.Never);
    }

    [Fact]
    public async Task GetTeamDetailAsync_NoPersistedSnapshot_FallsBackToLiveCalculation()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Georgia"] = new TeamInfo { Name = "Georgia", Conference = "SEC", Games = [] }
            },
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Georgia"] = new RatingDetails { RatingComponents = new Dictionary<string, double>() }
        };

        var rankingsResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Georgia", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);
        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync((RankingsResult?)null);
        _mockRatingModule.Setup(x => x.RateTeams(seasonData)).Returns(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2023)).ReturnsAsync(new List<ScheduleGame>());

        var result = await _teamsModule.GetTeamDetailAsync("Georgia", 2023, 5);

        Assert.NotNull(result);
        Assert.Equal("Georgia", result.RankedTeam.TeamName);
        _mockRatingModule.Verify(x => x.RateTeams(seasonData), Times.Once);
    }

    [Fact]
    public async Task GetTeamDetailAsync_ValidResult_ReturnsAllFields()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Georgia"] = new TeamInfo { Name = "Georgia", Conference = "SEC", Games = [] }
            },
            Games = []
        };

        var rankings = new List<RankedTeam>
        {
            new RankedTeam { TeamName = "Georgia", Rank = 1, Rating = 70.0, Details = new TeamDetails() }
        };

        var persistedResult = new RankingsResult { Season = 2023, Week = 5, Rankings = rankings };

        var fullSchedule = new List<ScheduleGame>
        {
            new ScheduleGame { HomeTeam = "Georgia", AwayTeam = "Oregon", Week = 1, Completed = true }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);
        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync(persistedResult);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2023)).ReturnsAsync(fullSchedule);

        var result = await _teamsModule.GetTeamDetailAsync("Georgia", 2023, 5);

        Assert.NotNull(result);
        Assert.Equal("Georgia", result.RankedTeam.TeamName);
        Assert.Single(result.AllRankings);
        Assert.Single(result.FullSchedule);
        Assert.Single(result.Teams);
    }

    [Fact]
    public async Task GetTeamDetailAsync_NullTeamName_ThrowsArgumentException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _teamsModule.GetTeamDetailAsync(null!, 2024, 5));
    }

    [Fact]
    public async Task GetTeamDetailAsync_EmptyTeamName_ThrowsArgumentException()
    {
        await Assert.ThrowsAsync<ArgumentException>(
            () => _teamsModule.GetTeamDetailAsync("", 2024, 5));
    }

    [Fact]
    public async Task GetTeamDetailAsync_WhitespaceTeamName_ThrowsArgumentException()
    {
        await Assert.ThrowsAsync<ArgumentException>(
            () => _teamsModule.GetTeamDetailAsync("   ", 2024, 5));
    }
}
