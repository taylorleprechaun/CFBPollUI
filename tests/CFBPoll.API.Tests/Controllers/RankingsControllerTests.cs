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
    private readonly Mock<IRankingsData> _mockRankingsData;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<IRatingModule> _mockRatingModule;
    private readonly Mock<ISeasonModule> _mockSeasonModule;
    private readonly RankingsController _controller;

    public RankingsControllerTests()
    {
        _mockDataService = new Mock<ICFBDataService>();
        _mockLogger = new Mock<ILogger<RankingsController>>();
        _mockRankingsData = new Mock<IRankingsData>();
        _mockRankingsModule = new Mock<IRankingsModule>();
        _mockRatingModule = new Mock<IRatingModule>();
        _mockSeasonModule = new Mock<ISeasonModule>();

        _controller = new RankingsController(
            _mockDataService.Object,
            _mockRankingsData.Object,
            _mockRankingsModule.Object,
            _mockRatingModule.Object,
            _mockSeasonModule.Object,
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

        _mockRankingsData
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
        _mockRankingsData
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
            .Setup(x => x.RateTeams(seasonData))
            .Returns(ratings);

        _mockRankingsModule
            .Setup(x => x.GenerateRankingsAsync(seasonData, ratings))
            .ReturnsAsync(rankingsResult);

        _mockDataService
            .Setup(x => x.GetMaxSeasonYearAsync())
            .ReturnsAsync(2025);

        var result = await _controller.GetRankings(2023, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RankingsResponseDTO>(okResult.Value);
        Assert.Equal("Team A", response.Rankings.First().TeamName);
    }

    [Fact]
    public async Task GetRankings_HistoricalSeason_AutoPersists()
    {
        _mockRankingsData
            .Setup(x => x.GetPublishedSnapshotAsync(2020, 5))
            .ReturnsAsync((RankingsResult?)null);

        var seasonData = new SeasonData
        {
            Season = 2020,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>(),
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>();

        var rankingsResult = new RankingsResult
        {
            Season = 2020,
            Week = 5,
            Rankings = new List<RankedTeam>()
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2020, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeams(seasonData)).Returns(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);
        _mockDataService.Setup(x => x.GetMaxSeasonYearAsync()).ReturnsAsync(2025);

        await _controller.GetRankings(2020, 5);

        _mockRankingsData.Verify(x => x.SaveSnapshotAsync(rankingsResult), Times.Once);
        _mockRankingsData.Verify(x => x.PublishSnapshotAsync(2020, 5), Times.Once);
    }

    [Fact]
    public async Task GetRankings_CurrentSeason_DoesNotAutoPersist()
    {
        _mockRankingsData
            .Setup(x => x.GetPublishedSnapshotAsync(2025, 5))
            .ReturnsAsync((RankingsResult?)null);

        var seasonData = new SeasonData
        {
            Season = 2025,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>(),
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>();

        var rankingsResult = new RankingsResult
        {
            Season = 2025,
            Week = 5,
            Rankings = new List<RankedTeam>()
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2025, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeams(seasonData)).Returns(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);
        _mockDataService.Setup(x => x.GetMaxSeasonYearAsync()).ReturnsAsync(2025);

        await _controller.GetRankings(2025, 5);

        _mockRankingsData.Verify(x => x.SaveSnapshotAsync(It.IsAny<RankingsResult>()), Times.Never);
    }

    [Fact]
    public async Task GetRankings_AutoPersistFailure_DoesNotAffectResponse()
    {
        _mockRankingsData
            .Setup(x => x.GetPublishedSnapshotAsync(2020, 5))
            .ReturnsAsync((RankingsResult?)null);

        var seasonData = new SeasonData
        {
            Season = 2020,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>(),
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>();

        var rankingsResult = new RankingsResult
        {
            Season = 2020,
            Week = 5,
            Rankings = new List<RankedTeam>()
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2020, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeams(seasonData)).Returns(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankingsResult);
        _mockDataService.Setup(x => x.GetMaxSeasonYearAsync()).ReturnsAsync(2025);
        _mockRankingsData
            .Setup(x => x.SaveSnapshotAsync(It.IsAny<RankingsResult>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        var result = await _controller.GetRankings(2020, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task GetAvailableWeeks_ReturnsPublishedWeeksOnly()
    {
        _mockRankingsData
            .Setup(x => x.GetPublishedWeekNumbersAsync(2024))
            .ReturnsAsync(new List<int> { 1, 3, 5 });

        var calendarWeeks = new List<CalendarWeek>
        {
            new CalendarWeek { Week = 1, SeasonType = "regular" },
            new CalendarWeek { Week = 2, SeasonType = "regular" },
            new CalendarWeek { Week = 3, SeasonType = "regular" },
            new CalendarWeek { Week = 4, SeasonType = "regular" },
            new CalendarWeek { Week = 5, SeasonType = "regular" }
        };

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(calendarWeeks);

        _mockSeasonModule
            .Setup(x => x.GetWeekLabels(calendarWeeks))
            .Returns(new List<WeekInfo>
            {
                new WeekInfo { WeekNumber = 1, Label = "Week 1" },
                new WeekInfo { WeekNumber = 2, Label = "Week 2" },
                new WeekInfo { WeekNumber = 3, Label = "Week 3" },
                new WeekInfo { WeekNumber = 4, Label = "Week 4" },
                new WeekInfo { WeekNumber = 5, Label = "Week 5" }
            });

        var result = await _controller.GetAvailableWeeks(2024);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<WeeksResponseDTO>(okResult.Value);
        Assert.Equal(2024, response.Season);

        var weeks = response.Weeks.ToList();
        Assert.Equal(3, weeks.Count);
        Assert.Contains(weeks, w => w.WeekNumber == 1);
        Assert.Contains(weeks, w => w.WeekNumber == 3);
        Assert.Contains(weeks, w => w.WeekNumber == 5);
    }

    [Fact]
    public async Task GetAvailableWeeks_NoPublishedWeeks_ReturnsEmpty()
    {
        _mockRankingsData
            .Setup(x => x.GetPublishedWeekNumbersAsync(2024))
            .ReturnsAsync(new List<int>());

        _mockDataService
            .Setup(x => x.GetCalendarAsync(2024))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new CalendarWeek { Week = 1, SeasonType = "regular" }
            });

        _mockSeasonModule
            .Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(new List<WeekInfo>
            {
                new WeekInfo { WeekNumber = 1, Label = "Week 1" }
            });

        var result = await _controller.GetAvailableWeeks(2024);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<WeeksResponseDTO>(okResult.Value);
        Assert.Empty(response.Weeks);
    }
}
