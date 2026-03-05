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
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<ILogger<RankingsController>> _mockLogger;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<IRatingModule> _mockRatingModule;
    private readonly RankingsController _controller;

    public RankingsControllerTests()
    {
        _mockDataService = new Mock<ICFBDataService>();
        _mockLogger = new Mock<ILogger<RankingsController>>();
        _mockRankingsModule = new Mock<IRankingsModule>();
        _mockRatingModule = new Mock<IRatingModule>();

        _controller = new RankingsController(
            _mockDataService.Object,
            _mockRankingsModule.Object,
            _mockRatingModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task GetRankings_PersistedSnapshot_ReturnsPersistedRankings()
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
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 5))
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

    [Fact]
    public async Task GetRankings_NoPersistedSnapshot_FallsBackToLiveCalculation()
    {
        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 5))
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
    public async Task GetRankings_LiveCalculation_DoesNotAttemptAutoPersist()
    {
        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2023, 5))
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

        _mockRankingsModule.Verify(x => x.SaveSnapshotAsync(It.IsAny<RankingsResult>()), Times.Never);
        _mockRankingsModule.Verify(x => x.PublishSnapshotAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetRankings_PersistedSnapshot_IncludesRankDeltas()
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
            .Setup(x => x.GetPublishedSnapshotAsync(2024, 5))
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
    public async Task GetRankings_LiveCalculation_IncludesRankDeltas()
    {
        _mockRankingsModule
            .Setup(x => x.GetPublishedSnapshotAsync(2024, 5))
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
    public async Task GetRankings_PersistedSnapshot_CallsGetRankDeltasAsync()
    {
        var persistedResult = new RankingsResult
        {
            Season = 2024, Week = 3,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Notre Dame", Rank = 1, Details = new TeamDetails() }
            }
        };

        _mockRankingsModule.Setup(x => x.GetPublishedSnapshotAsync(2024, 3)).ReturnsAsync(persistedResult);
        _mockRankingsModule
            .Setup(x => x.GetRankDeltasAsync(2024, 3, persistedResult.Rankings))
            .ReturnsAsync(new Dictionary<string, int?> { ["Notre Dame"] = 0 });

        await _controller.GetRankings(2024, 3);

        _mockRankingsModule.Verify(x => x.GetRankDeltasAsync(2024, 3, persistedResult.Rankings), Times.Once);
    }

    [Fact]
    public void Constructor_NullDataService_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new RankingsController(
                null!,
                new Mock<IRankingsModule>().Object,
                new Mock<IRatingModule>().Object,
                new Mock<ILogger<RankingsController>>().Object));
    }

    [Fact]
    public void Constructor_NullRankingsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new RankingsController(
                new Mock<ICFBDataService>().Object,
                null!,
                new Mock<IRatingModule>().Object,
                new Mock<ILogger<RankingsController>>().Object));
    }

    [Fact]
    public void Constructor_NullRatingModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new RankingsController(
                new Mock<ICFBDataService>().Object,
                new Mock<IRankingsModule>().Object,
                null!,
                new Mock<ILogger<RankingsController>>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new RankingsController(
                new Mock<ICFBDataService>().Object,
                new Mock<IRankingsModule>().Object,
                new Mock<IRatingModule>().Object,
                null!));
    }
}
