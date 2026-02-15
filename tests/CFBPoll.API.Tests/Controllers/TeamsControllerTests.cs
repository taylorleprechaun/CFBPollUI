using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

using Record = CFBPoll.Core.Models.Record;

namespace CFBPoll.API.Tests.Controllers;

public class TeamsControllerTests
{
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<ILogger<TeamsController>> _mockLogger;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<IRatingModule> _mockRatingModule;
    private readonly TeamsController _controller;

    public TeamsControllerTests()
    {
        _mockDataService = new Mock<ICFBDataService>();
        _mockLogger = new Mock<ILogger<TeamsController>>();
        _mockRankingsModule = new Mock<IRankingsModule>();
        _mockRatingModule = new Mock<IRatingModule>();

        _controller = new TeamsController(
            _mockDataService.Object,
            _mockRankingsModule.Object,
            _mockRatingModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task GetTeamDetail_EmptyTeamName_ReturnsBadRequest()
    {
        var result = await _controller.GetTeamDetail(" ", 2023, 5);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetTeamDetail_TeamNotFound_ReturnsNotFound()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Alabama"] = new TeamInfo
                {
                    Name = "Alabama",
                    Conference = "SEC",
                    Wins = 5,
                    Losses = 0,
                    Games = []
                }
            },
            Games = []
        };

        _mockDataService
            .Setup(x => x.GetSeasonDataAsync(2023, 5))
            .ReturnsAsync(seasonData);

        var result = await _controller.GetTeamDetail("NonExistentTeam", 2023, 5);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetTeamDetail_TeamNotInRankings_ReturnsNotFound()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Georgia"] = new TeamInfo
                {
                    Name = "Georgia",
                    Conference = "SEC",
                    Wins = 5,
                    Losses = 0,
                    Games = []
                }
            },
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Georgia"] = new RatingDetails
            {
                Wins = 5,
                Losses = 0,
                StrengthOfSchedule = 0.5,
                WeightedStrengthOfSchedule = 0.6,
                RatingComponents = new Dictionary<string, double>
                {
                    ["BaseWins"] = 50
                }
            }
        };

        var rankingsResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam
                {
                    TeamName = "Alabama",
                    Rank = 1,
                    Details = new TeamDetails()
                }
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

        var result = await _controller.GetTeamDetail("Georgia", 2023, 5);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetTeamDetail_ValidRequest_ReturnsTeamDetail()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Georgia"] = new TeamInfo
                {
                    Name = "Georgia",
                    Color = "#BA0C2F",
                    AltColor = "#000000",
                    Conference = "SEC",
                    Division = "East",
                    LogoURL = "https://example.com/georgia.png",
                    Wins = 5,
                    Losses = 0,
                    Games = []
                }
            },
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Georgia"] = new RatingDetails
            {
                Wins = 5,
                Losses = 0,
                StrengthOfSchedule = 0.7,
                WeightedStrengthOfSchedule = 0.8,
                RatingComponents = new Dictionary<string, double>
                {
                    ["BaseWins"] = 50,
                    ["MarginFactor"] = 8,
                    ["SOSBonus"] = 12
                }
            }
        };

        var rankingsResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam
                {
                    TeamName = "Georgia",
                    Rank = 1,
                    Conference = "SEC",
                    Division = "East",
                    LogoURL = "https://example.com/georgia.png",
                    Wins = 5,
                    Losses = 0,
                    Rating = 70.0,
                    SOSRanking = 3,
                    WeightedSOS = 0.8,
                    Details = new TeamDetails
                    {
                        Home = new Record { Wins = 3, Losses = 0 },
                        Away = new Record { Wins = 2, Losses = 0 }
                    }
                }
            }
        };

        var fullSchedule = new List<ScheduleGame>
        {
            new ScheduleGame
            {
                GameID = 1,
                Week = 1,
                SeasonType = "regular",
                HomeTeam = "Georgia",
                AwayTeam = "Oregon",
                HomePoints = 28,
                AwayPoints = 21,
                Completed = true,
                NeutralSite = false,
                Venue = "Sanford Stadium",
                StartDate = new DateTime(2023, 9, 2)
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
            .Setup(x => x.GetFullSeasonScheduleAsync(2023))
            .ReturnsAsync(fullSchedule);

        var result = await _controller.GetTeamDetail("Georgia", 2023, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<TeamDetailResponseDTO>(okResult.Value);
        Assert.Equal("Georgia", response.TeamName);
        Assert.Equal(1, response.Rank);
        Assert.Equal(70.0, response.Rating);
        Assert.Equal("SEC", response.Conference);
        Assert.Equal("East", response.Division);
        Assert.Equal("https://example.com/georgia.png", response.LogoURL);
        Assert.Equal("5-0", response.Record);
        Assert.Equal(3, response.SOSRanking);
        Assert.Equal(0.8, response.WeightedSOS);
        Assert.NotNull(response.Details);
        Assert.NotNull(response.Schedule);
    }
}
