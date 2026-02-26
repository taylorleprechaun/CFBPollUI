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

    [Fact]
    public async Task GetTeamDetailAsync_PublishedSnapshot_SkipsGetSeasonDataAsync()
    {
        var publishedResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Florida", Rank = 1, Wins = 4, Losses = 1, Details = new TeamDetails() }
            }
        };

        var fbsTeams = new List<FBSTeam>
        {
            new FBSTeam { Name = "Florida", Color = "#0021A5", AltColor = "#FF6600", Conference = "SEC" }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync(publishedResult);
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2023)).ReturnsAsync(fbsTeams);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2023)).ReturnsAsync(new List<ScheduleGame>());

        var result = await _teamsModule.GetTeamDetailAsync("Florida", 2023, 5);

        Assert.NotNull(result);
        Assert.Equal("Florida", result.RankedTeam.TeamName);
        _mockDataService.Verify(x => x.GetSeasonDataAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        _mockRatingModule.Verify(x => x.RateTeamsAsync(It.IsAny<SeasonData>()), Times.Never);
    }

    [Fact]
    public async Task GetTeamDetailAsync_PublishedSnapshot_UsesGetFBSTeamsAsync()
    {
        var publishedResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Florida", Rank = 1, Wins = 4, Losses = 1, Details = new TeamDetails() }
            }
        };

        var fbsTeams = new List<FBSTeam>
        {
            new FBSTeam { Name = "Florida", Color = "#0021A5", AltColor = "#FF6600", Conference = "SEC" }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync(publishedResult);
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2023)).ReturnsAsync(fbsTeams);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2023)).ReturnsAsync(new List<ScheduleGame>());

        await _teamsModule.GetTeamDetailAsync("Florida", 2023, 5);

        _mockDataService.Verify(x => x.GetFBSTeamsAsync(2023), Times.Once);
    }

    [Fact]
    public async Task GetTeamDetailAsync_PublishedSnapshot_BuildsTeamsFromMetadata()
    {
        var publishedResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Florida", Rank = 1, Wins = 4, Losses = 1, LogoURL = "logo.png", Details = new TeamDetails() },
                new RankedTeam { TeamName = "Alabama", Rank = 2, Wins = 5, Losses = 0, Details = new TeamDetails() }
            }
        };

        var fbsTeams = new List<FBSTeam>
        {
            new FBSTeam { Name = "Florida", Color = "#0021A5", AltColor = "#FF6600", Conference = "SEC", LogoURL = "florida.png" },
            new FBSTeam { Name = "Alabama", Color = "#9E1B32", AltColor = "#FFFFFF", Conference = "SEC", LogoURL = "bama.png" }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync(publishedResult);
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2023)).ReturnsAsync(fbsTeams);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2023)).ReturnsAsync(new List<ScheduleGame>());

        var result = await _teamsModule.GetTeamDetailAsync("Florida", 2023, 5);

        Assert.NotNull(result);
        Assert.Equal(2, result.Teams.Count);
        Assert.True(result.Teams.ContainsKey("Florida"));
        Assert.True(result.Teams.ContainsKey("Alabama"));
        Assert.Equal("#0021A5", result.Teams["Florida"].Color);
        Assert.Equal("#FF6600", result.Teams["Florida"].AltColor);
        Assert.Equal(4, result.Teams["Florida"].Wins);
        Assert.Equal(1, result.Teams["Florida"].Losses);
    }

    [Fact]
    public async Task GetTeamDetailAsync_PublishedSnapshot_TeamNotInRankings_ReturnsNull()
    {
        var publishedResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Alabama", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync(publishedResult);

        var result = await _teamsModule.GetTeamDetailAsync("Florida", 2023, 5);

        Assert.Null(result);
        _mockDataService.Verify(x => x.GetFBSTeamsAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetTeamDetailAsync_PublishedSnapshot_ReturnsAllFields()
    {
        var rankings = new List<RankedTeam>
        {
            new RankedTeam { TeamName = "Florida", Rank = 1, Rating = 70.0, Wins = 4, Losses = 1, Details = new TeamDetails() }
        };

        var publishedResult = new RankingsResult { Season = 2023, Week = 5, Rankings = rankings };

        var fbsTeams = new List<FBSTeam>
        {
            new FBSTeam { Name = "Florida", Color = "#0021A5", AltColor = "#FF6600", Conference = "SEC" }
        };

        var fullSchedule = new List<ScheduleGame>
        {
            new ScheduleGame { HomeTeam = "Florida", AwayTeam = "USC", Week = 1, Completed = true }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync(publishedResult);
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2023)).ReturnsAsync(fbsTeams);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2023)).ReturnsAsync(fullSchedule);

        var result = await _teamsModule.GetTeamDetailAsync("Florida", 2023, 5);

        Assert.NotNull(result);
        Assert.Equal("Florida", result.RankedTeam.TeamName);
        Assert.Single(result.AllRankings);
        Assert.Single(result.FullSchedule);
        Assert.Single(result.Teams);
    }

    [Fact]
    public async Task GetTeamDetailAsync_NoPublishedSnapshot_TeamNotInSeasonData_ReturnsNull()
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

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync((RankingsResult?)null);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);

        var result = await _teamsModule.GetTeamDetailAsync("NonExistentTeam", 2023, 5);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetTeamDetailAsync_NoPublishedSnapshot_TeamNotInRankings_ReturnsNull()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Florida"] = new TeamInfo { Name = "Florida", Games = [] }
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

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Florida"] = new RatingDetails { RatingComponents = new Dictionary<string, double>() }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync((RankingsResult?)null);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);

        var result = await _teamsModule.GetTeamDetailAsync("Florida", 2023, 5);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetTeamDetailAsync_NoPublishedSnapshot_FallsBackToLiveCalculation()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Florida"] = new TeamInfo { Name = "Florida", Conference = "SEC", Games = [] }
            },
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Florida"] = new RatingDetails { RatingComponents = new Dictionary<string, double>() }
        };

        var rankingsResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Florida", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync((RankingsResult?)null);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2023)).ReturnsAsync(new List<ScheduleGame>());

        var result = await _teamsModule.GetTeamDetailAsync("Florida", 2023, 5);

        Assert.NotNull(result);
        Assert.Equal("Florida", result.RankedTeam.TeamName);
        _mockRatingModule.Verify(x => x.RateTeamsAsync(seasonData), Times.Once);
        _mockDataService.Verify(x => x.GetFBSTeamsAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetTeamDetailAsync_NoPublishedSnapshot_CallsGenerateRankingsAsync()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Florida"] = new TeamInfo { Name = "Florida", Conference = "SEC", Games = [] }
            },
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Florida"] = new RatingDetails { RatingComponents = new Dictionary<string, double>() }
        };

        var rankingsResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Florida", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync((RankingsResult?)null);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2023)).ReturnsAsync(new List<ScheduleGame>());

        await _teamsModule.GetTeamDetailAsync("Florida", 2023, 5);

        _mockRankingsModule.Verify(x => x.GenerateRankingsAsync(seasonData, ratings), Times.Once);
    }

    [Fact]
    public async Task GetTeamDetailAsync_NoPublishedSnapshot_ReturnsSeasonDataTeams()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Florida"] = new TeamInfo { Name = "Florida", Conference = "SEC", Color = "#0021A5", Games = [] }
            },
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Florida"] = new RatingDetails { RatingComponents = new Dictionary<string, double>() }
        };

        var rankingsResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Florida", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync((RankingsResult?)null);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2023)).ReturnsAsync(new List<ScheduleGame>());

        var result = await _teamsModule.GetTeamDetailAsync("Florida", 2023, 5);

        Assert.NotNull(result);
        Assert.Same(seasonData.Teams, result.Teams);
    }

    [Fact]
    public async Task GetTeamDetailAsync_GetSeasonDataAsyncThrows_PropagatesException()
    {
        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync((RankingsResult?)null);
        _mockDataService
            .Setup(x => x.GetSeasonDataAsync(2023, 5))
            .ThrowsAsync(new InvalidOperationException("API unavailable"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _teamsModule.GetTeamDetailAsync("Florida", 2023, 5));
    }

    [Fact]
    public async Task GetTeamDetailAsync_RateTeamsAsyncThrows_PropagatesException()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Florida"] = new TeamInfo { Name = "Florida", Games = [] }
            },
            Games = []
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync((RankingsResult?)null);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);
        _mockRatingModule
            .Setup(x => x.RateTeamsAsync(seasonData))
            .ThrowsAsync(new InvalidOperationException("Rating calculation failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _teamsModule.GetTeamDetailAsync("Florida", 2023, 5));
    }

    [Fact]
    public async Task GetTeamDetailAsync_NoPublishedSnapshot_GetFullSeasonScheduleAsyncThrows_PropagatesException()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Florida"] = new TeamInfo { Name = "Florida", Games = [] }
            },
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Florida"] = new RatingDetails { RatingComponents = new Dictionary<string, double>() }
        };

        var rankingsResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Florida", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync((RankingsResult?)null);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);
        _mockDataService
            .Setup(x => x.GetFullSeasonScheduleAsync(2023))
            .ThrowsAsync(new InvalidOperationException("Schedule fetch failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _teamsModule.GetTeamDetailAsync("Florida", 2023, 5));
    }

    [Fact]
    public async Task GetTeamDetailAsync_PublishedSnapshot_GetFullSeasonScheduleAsyncThrows_PropagatesException()
    {
        var publishedResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Florida", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync(publishedResult);
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2023)).ReturnsAsync(new List<FBSTeam>());
        _mockDataService
            .Setup(x => x.GetFullSeasonScheduleAsync(2023))
            .ThrowsAsync(new InvalidOperationException("Schedule fetch failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _teamsModule.GetTeamDetailAsync("Florida", 2023, 5));
    }

    [Fact]
    public async Task GetTeamDetailAsync_GetFBSTeamsAsyncThrows_PropagatesException()
    {
        var publishedResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Florida", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync(publishedResult);
        _mockDataService
            .Setup(x => x.GetFBSTeamsAsync(2023))
            .ThrowsAsync(new InvalidOperationException("FBS teams fetch failed"));
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2023)).ReturnsAsync(new List<ScheduleGame>());

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _teamsModule.GetTeamDetailAsync("Florida", 2023, 5));
    }

    [Fact]
    public async Task GetTeamDetailAsync_PublishedSnapshot_FBSTeamNotInRankings_HasZeroWinsLosses()
    {
        var publishedResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Florida", Rank = 1, Wins = 4, Losses = 1, Details = new TeamDetails() }
            }
        };

        var fbsTeams = new List<FBSTeam>
        {
            new FBSTeam { Name = "Florida", Color = "#0021A5", Conference = "SEC" },
            new FBSTeam { Name = "Notre Dame", Color = "#0C2340", Conference = "Independent" }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2023, 5)).ReturnsAsync(publishedResult);
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2023)).ReturnsAsync(fbsTeams);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2023)).ReturnsAsync(new List<ScheduleGame>());

        var result = await _teamsModule.GetTeamDetailAsync("Florida", 2023, 5);

        Assert.NotNull(result);
        Assert.Equal(0, result.Teams["Notre Dame"].Wins);
        Assert.Equal(0, result.Teams["Notre Dame"].Losses);
    }
}
