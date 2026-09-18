using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class RankingsControllerTests
{
    private readonly RankingsController _controller;
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<IGameOverrideModule> _mockGameOverrideModule;
    private readonly Mock<ILogger<RankingsController>> _mockLogger;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<IRatingAlgorithmResolver> _mockRatingAlgorithmResolver;
    private readonly Mock<IRatingModule> _mockRatingModule;

    public RankingsControllerTests()
    {
        _mockDataService = new Mock<ICFBDataService>();
        _mockGameOverrideModule = new Mock<IGameOverrideModule>();
        _mockGameOverrideModule
            .Setup(x => x.GetGameOverridesBySeasonAsync(It.IsAny<int>()))
            .ReturnsAsync(Enumerable.Empty<GameOverride>());
        _mockLogger = new Mock<ILogger<RankingsController>>();
        _mockRankingsModule = new Mock<IRankingsModule>();
        _mockRatingModule = new Mock<IRatingModule>();
        _mockRatingAlgorithmResolver = new Mock<IRatingAlgorithmResolver>();
        _mockRatingAlgorithmResolver.Setup(x => x.ResolveForSeason(It.IsAny<int>())).Returns(_mockRatingModule.Object);

        _controller = new RankingsController(
            _mockDataService.Object,
            _mockGameOverrideModule.Object,
            _mockRankingsModule.Object,
            _mockRatingAlgorithmResolver.Object,
            _mockLogger.Object);
    }

    [Fact]
    public void Constructor_NullDataService_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new RankingsController(
                null!,
                new Mock<IGameOverrideModule>().Object,
                new Mock<IRankingsModule>().Object,
                new Mock<IRatingAlgorithmResolver>().Object,
                new Mock<ILogger<RankingsController>>().Object));
    }

    [Fact]
    public void Constructor_NullGameOverrideModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new RankingsController(
                new Mock<ICFBDataService>().Object,
                null!,
                new Mock<IRankingsModule>().Object,
                new Mock<IRatingAlgorithmResolver>().Object,
                new Mock<ILogger<RankingsController>>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new RankingsController(
                new Mock<ICFBDataService>().Object,
                new Mock<IGameOverrideModule>().Object,
                new Mock<IRankingsModule>().Object,
                new Mock<IRatingAlgorithmResolver>().Object,
                null!));
    }

    [Fact]
    public void Constructor_NullRankingsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new RankingsController(
                new Mock<ICFBDataService>().Object,
                new Mock<IGameOverrideModule>().Object,
                null!,
                new Mock<IRatingAlgorithmResolver>().Object,
                new Mock<ILogger<RankingsController>>().Object));
    }

    [Fact]
    public void Constructor_NullRatingAlgorithmResolver_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new RankingsController(
                new Mock<ICFBDataService>().Object,
                new Mock<IGameOverrideModule>().Object,
                new Mock<IRankingsModule>().Object,
                null!,
                new Mock<ILogger<RankingsController>>().Object));
    }

    [Fact]
    public async Task GetRankings_LiveCalculation_DoesNotAttemptAutoPersist()
    {
        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2023, 5))
            .ReturnsAsync((RankingsResult?)null);

        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>(),
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>();
        var rankingsResult = new RankingsResult { Season = 2023, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2023, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);
        _mockRankingsModule
            .Setup(x => x.GetRankDeltasAsync(2023, 5, rankingsResult.Rankings))
            .ReturnsAsync(new Dictionary<string, int?>());

        await _controller.GetRankings(2023, 5);

        _mockRankingsModule.Verify(x => x.SaveRankingsSnapshotAsync(It.IsAny<RankingsResult>(), It.IsAny<RatingAlgorithmVersion>()), Times.Never);
        _mockRankingsModule.Verify(x => x.PublishRankingsSnapshotAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetRankings_LiveCalculation_IncludesAllSeasonScoreOverrides()
    {
        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2025, 6))
            .ReturnsAsync((RankingsResult?)null);

        var seasonData = new SeasonData
        {
            Season = 2025,
            Week = 6,
            Teams = new Dictionary<string, TeamInfo>(),
            Games = []
        };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankingsResult = new RankingsResult { Season = 2025, Week = 6, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2025, 6)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);
        _mockRankingsModule
            .Setup(x => x.GetRankDeltasAsync(2025, 6, rankingsResult.Rankings))
            .ReturnsAsync(new Dictionary<string, int?>());

        var earlyOverride = CreateGameOverride(
            gameID: 401234561, week: 2, createdAt: new DateTime(2025, 9, 10, 0, 0, 0, DateTimeKind.Utc));
        var lateOverride = CreateGameOverride(
            gameID: 401234562, week: 5, createdAt: new DateTime(2025, 10, 20, 0, 0, 0, DateTimeKind.Utc));
        _mockGameOverrideModule
            .Setup(x => x.GetGameOverridesBySeasonAsync(2025))
            .ReturnsAsync(new List<GameOverride> { earlyOverride, lateOverride });

        var result = await _controller.GetRankings(2025, 6);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RankingsResponseDTO>(okResult.Value);
        Assert.Equal(2, response.ScoreOverrides.Count());
    }

    [Fact]
    public async Task GetRankings_LiveCalculation_IncludesRankDeltas()
    {
        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2024, 5))
            .ReturnsAsync((RankingsResult?)null);

        var seasonData = new SeasonData
        {
            Season = 2024, Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Texas"] = new TeamInfo { Name = "Texas", Games = [] }
            },
            Games = []
        };
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Texas"] = new RatingDetails { Wins = 8, Losses = 1, RatingComponents = new Dictionary<string, double>() }
        };
        var rankingsResult = new RankingsResult
        {
            Season = 2024, Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Texas", Rank = 1, Rating = 92, Details = new TeamDetails() }
            }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);
        _mockRankingsModule
            .Setup(x => x.GetRankDeltasAsync(2024, 5, rankingsResult.Rankings))
            .ReturnsAsync(new Dictionary<string, int?> { ["Texas"] = 2 });

        var result = await _controller.GetRankings(2024, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RankingsResponseDTO>(okResult.Value);
        Assert.Equal(2, response.Rankings.First().RankDelta);
    }

    [Fact]
    public async Task GetRankings_LiveCalculation_ScoreOverridesIncludeOriginalAndOverrideScores()
    {
        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2025, 6))
            .ReturnsAsync((RankingsResult?)null);

        var seasonData = new SeasonData
        {
            Season = 2025,
            Week = 6,
            Teams = new Dictionary<string, TeamInfo>(),
            Games = []
        };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankingsResult = new RankingsResult { Season = 2025, Week = 6, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2025, 6)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);
        _mockRankingsModule
            .Setup(x => x.GetRankDeltasAsync(2025, 6, rankingsResult.Rankings))
            .ReturnsAsync(new Dictionary<string, int?>());

        var gameOverride = CreateGameOverride(
            gameID: 401234561, week: 2, createdAt: new DateTime(2025, 9, 10, 0, 0, 0, DateTimeKind.Utc));
        _mockGameOverrideModule
            .Setup(x => x.GetGameOverridesBySeasonAsync(2025))
            .ReturnsAsync(new List<GameOverride> { gameOverride });
        _mockDataService.Setup(x => x.GetFBSTeamsAsync(2025))
            .ReturnsAsync([
                new FBSTeam { Name = "Iowa", LogoURL = "https://example.com/iowa.png" },
                new FBSTeam { Name = "Oklahoma", LogoURL = "https://example.com/oklahoma.png" }
            ]);

        var result = await _controller.GetRankings(2025, 6);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RankingsResponseDTO>(okResult.Value);
        var disclosedOverride = Assert.Single(response.ScoreOverrides);
        Assert.Equal(24, disclosedOverride.OriginalAwayPoints);
        Assert.Equal(20, disclosedOverride.OriginalHomePoints);
        Assert.Equal(20, disclosedOverride.OverrideAwayPoints);
        Assert.Equal(24, disclosedOverride.OverrideHomePoints);
        Assert.Equal("https://example.com/iowa.png", disclosedOverride.AwayTeamLogoURL);
        Assert.Equal("https://example.com/oklahoma.png", disclosedOverride.HomeTeamLogoURL);
    }

    [Fact]
    public async Task GetRankings_NoPersistedRankingsSnapshot_FallsBackToLiveCalculation()
    {
        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2023, 5))
            .ReturnsAsync((RankingsResult?)null);

        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Conference = "Conference 1", Games = [] }
            },
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails { Wins = 4, Losses = 1, RatingComponents = new Dictionary<string, double>() }
        };

        var rankingsResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Team A", Rank = 1, Rating = 55, Details = new TeamDetails() }
            }
        };

        _mockDataService
            .Setup(x => x.GetSeasonDataAsync(2023, 5))
            .ReturnsAsync(seasonData);

        _mockRatingModule
            .Setup(x => x.RateTeamsAsync(seasonData))
            .ReturnsAsync(ratings);

        _mockRankingsModule
            .Setup(x => x.GenerateRankingsAsync(seasonData, ratings))
            .ReturnsAsync(rankingsResult);

        _mockRankingsModule
            .Setup(x => x.GetRankDeltasAsync(2023, 5, rankingsResult.Rankings))
            .ReturnsAsync(new Dictionary<string, int?> { ["Team A"] = null });

        var result = await _controller.GetRankings(2023, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RankingsResponseDTO>(okResult.Value);
        Assert.Equal("Team A", response.Rankings.First().TeamName);
    }

    [Fact]
    public async Task GetRankings_PersistedRankingsSnapshot_CallsGetRankDeltasAsync()
    {
        var persistedResult = new RankingsResult
        {
            Season = 2024, Week = 3,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Notre Dame", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedRankingsSnapshotAsync(2024, 3)).ReturnsAsync(persistedResult);
        _mockRankingsModule
            .Setup(x => x.GetRankDeltasAsync(2024, 3, persistedResult.Rankings))
            .ReturnsAsync(new Dictionary<string, int?> { ["Notre Dame"] = 0 });

        await _controller.GetRankings(2024, 3);

        _mockRankingsModule.Verify(x => x.GetRankDeltasAsync(2024, 3, persistedResult.Rankings), Times.Once);
    }

    [Fact]
    public async Task GetRankings_PersistedRankingsSnapshot_ExcludesAllOverridesWhenPublishedAtIsNull()
    {
        var persistedResult = new RankingsResult
        {
            Season = 2025,
            Week = 4,
            PublishedAt = null,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Oklahoma", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedRankingsSnapshotAsync(2025, 4)).ReturnsAsync(persistedResult);
        _mockRankingsModule
            .Setup(x => x.GetRankDeltasAsync(2025, 4, persistedResult.Rankings))
            .ReturnsAsync(new Dictionary<string, int?> { ["Oklahoma"] = 0 });

        var gameOverride = CreateGameOverride(
            gameID: 401234563, week: 3, createdAt: new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc));
        _mockGameOverrideModule
            .Setup(x => x.GetGameOverridesBySeasonAsync(2025))
            .ReturnsAsync(new List<GameOverride> { gameOverride });

        var result = await _controller.GetRankings(2025, 4);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RankingsResponseDTO>(okResult.Value);
        Assert.Empty(response.ScoreOverrides);
    }

    [Fact]
    public async Task GetRankings_PersistedRankingsSnapshot_IncludesOnlyOverridesCreatedBeforePublish()
    {
        var persistedResult = new RankingsResult
        {
            Season = 2025,
            Week = 4,
            PublishedAt = new DateTime(2025, 10, 1, 0, 0, 0, DateTimeKind.Utc),
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Oklahoma", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedRankingsSnapshotAsync(2025, 4)).ReturnsAsync(persistedResult);
        _mockRankingsModule
            .Setup(x => x.GetRankDeltasAsync(2025, 4, persistedResult.Rankings))
            .ReturnsAsync(new Dictionary<string, int?> { ["Oklahoma"] = 0 });

        var overrideBeforePublish = CreateGameOverride(
            gameID: 401234564, week: 2, createdAt: new DateTime(2025, 9, 15, 0, 0, 0, DateTimeKind.Utc));
        var overrideAfterPublish = CreateGameOverride(
            gameID: 401234565, week: 3, createdAt: new DateTime(2025, 10, 15, 0, 0, 0, DateTimeKind.Utc));
        _mockGameOverrideModule
            .Setup(x => x.GetGameOverridesBySeasonAsync(2025))
            .ReturnsAsync(new List<GameOverride> { overrideBeforePublish, overrideAfterPublish });

        var result = await _controller.GetRankings(2025, 4);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RankingsResponseDTO>(okResult.Value);
        var disclosedOverride = Assert.Single(response.ScoreOverrides);
        Assert.Equal(401234564, disclosedOverride.GameID);
    }

    [Fact]
    public async Task GetRankings_PersistedRankingsSnapshot_IncludesRankDeltas()
    {
        var persistedResult = new RankingsResult
        {
            Season = 2024, Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Florida", Rank = 1, Rating = 90, Details = new TeamDetails() },
                new RankedTeam { TeamName = "Alabama", Rank = 2, Rating = 85, Details = new TeamDetails() }
            }
        };

        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2024, 5))
            .ReturnsAsync(persistedResult);

        _mockRankingsModule
            .Setup(x => x.GetRankDeltasAsync(2024, 5, persistedResult.Rankings))
            .ReturnsAsync(new Dictionary<string, int?> { ["Florida"] = 3, ["Alabama"] = -1 });

        var result = await _controller.GetRankings(2024, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RankingsResponseDTO>(okResult.Value);
        var rankings = response.Rankings.ToList();
        Assert.Equal(3, rankings[0].RankDelta);
        Assert.Equal(-1, rankings[1].RankDelta);
    }

    [Fact]
    public async Task GetRankings_PersistedRankingsSnapshot_ReturnsPersistedRankings()
    {
        var persistedResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam
                {
                    TeamName = "Team A",
                    Rank = 1,
                    Rating = 55,
                    Details = new TeamDetails()
                }
            }
        };

        _mockRankingsModule
            .Setup(x => x.GetPublishedRankingsSnapshotAsync(2023, 5))
            .ReturnsAsync(persistedResult);

        _mockRankingsModule
            .Setup(x => x.GetRankDeltasAsync(2023, 5, persistedResult.Rankings))
            .ReturnsAsync(new Dictionary<string, int?> { ["Team A"] = null });

        var result = await _controller.GetRankings(2023, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RankingsResponseDTO>(okResult.Value);
        Assert.Equal(2023, response.Season);
        Assert.Equal(5, response.Week);
        Assert.Single(response.Rankings);
        Assert.Equal("Team A", response.Rankings.First().TeamName);

        _mockDataService.Verify(x => x.GetSeasonDataAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    private static GameOverride CreateGameOverride(long gameID, int week, DateTime createdAt)
    {
        return new GameOverride
        {
            AwayTeam = "Iowa",
            AwayTeamLogoURL = "https://example.com/iowa.png",
            CreatedAt = createdAt,
            GameID = gameID,
            HomeTeam = "Oklahoma",
            HomeTeamLogoURL = "https://example.com/oklahoma.png",
            ModifiedAt = createdAt,
            OriginalAwayPoints = 24,
            OriginalHomePoints = 20,
            OverrideAwayPoints = 20,
            OverrideHomePoints = 24,
            Reason = "A targeting penalty on the final defensive snap should have extended the drive.",
            Season = 2025,
            SeasonType = "regular",
            Week = week
        };
    }
}
