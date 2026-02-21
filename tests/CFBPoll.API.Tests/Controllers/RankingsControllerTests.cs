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

        var result = await _controller.GetRankings(2023, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RankingsResponseDTO>(okResult.Value);
        Assert.Equal("Team A", response.Rankings.First().TeamName);
    }

    [Fact]
    public async Task GetAvailableWeeks_ReturnsPublishedWeeksOnly()
    {
        var calendarWeeks = new List<CalendarWeek>
        {
            new CalendarWeek { Week = 1, SeasonType = "regular" },
            new CalendarWeek { Week = 2, SeasonType = "regular" },
            new CalendarWeek { Week = 3, SeasonType = "regular" }
        };

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(calendarWeeks);

        _mockRankingsModule
            .Setup(x => x.GetAvailableWeeksAsync(2024, calendarWeeks))
            .ReturnsAsync(new List<WeekInfo>
            {
                new WeekInfo { WeekNumber = 1, Label = "Week 1" },
                new WeekInfo { WeekNumber = 3, Label = "Week 3" }
            });

        var result = await _controller.GetAvailableWeeks(2024);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<WeeksResponseDTO>(okResult.Value);
        Assert.Equal(2024, response.Season);

        var weeks = response.Weeks.ToList();
        Assert.Equal(2, weeks.Count);
        Assert.Contains(weeks, w => w.WeekNumber == 1);
        Assert.Contains(weeks, w => w.WeekNumber == 3);
    }

    [Fact]
    public async Task GetAvailableWeeks_NoPublishedWeeks_ReturnsEmpty()
    {
        var calendarWeeks = new List<CalendarWeek>
        {
            new CalendarWeek { Week = 1, SeasonType = "regular" }
        };

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(calendarWeeks);

        _mockRankingsModule
            .Setup(x => x.GetAvailableWeeksAsync(2024, calendarWeeks))
            .ReturnsAsync(new List<WeekInfo>());

        var result = await _controller.GetAvailableWeeks(2024);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<WeeksResponseDTO>(okResult.Value);
        Assert.Empty(response.Weeks);
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

        await _controller.GetRankings(2023, 5);

        _mockRankingsModule.Verify(x => x.SaveSnapshotAsync(It.IsAny<RankingsResult>()), Times.Never);
        _mockRankingsModule.Verify(x => x.PublishSnapshotAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
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
