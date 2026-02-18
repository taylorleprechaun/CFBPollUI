using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class TeamsControllerTests
{
    private readonly Mock<ILogger<TeamsController>> _mockLogger;
    private readonly Mock<ITeamsModule> _mockTeamsModule;
    private readonly TeamsController _controller;

    public TeamsControllerTests()
    {
        _mockLogger = new Mock<ILogger<TeamsController>>();
        _mockTeamsModule = new Mock<ITeamsModule>();

        _controller = new TeamsController(_mockTeamsModule.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetTeamDetail_EmptyTeamName_ReturnsBadRequest()
    {
        var result = await _controller.GetTeamDetail(" ", 2023, 5);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetTeamDetail_ModuleReturnsNull_ReturnsNotFound()
    {
        _mockTeamsModule
            .Setup(x => x.GetTeamDetailAsync("NonExistentTeam", 2023, 5))
            .ReturnsAsync((TeamDetailResult?)null);

        var result = await _controller.GetTeamDetail("NonExistentTeam", 2023, 5);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetTeamDetail_ValidResult_ReturnsTeamDetail()
    {
        var teamDetailResult = new TeamDetailResult
        {
            AllRankings = new List<RankedTeam>
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
                    Details = new TeamDetails()
                }
            },
            FullSchedule = new List<ScheduleGame>
            {
                new ScheduleGame
                {
                    HomeTeam = "Georgia",
                    AwayTeam = "Oregon",
                    Week = 1,
                    SeasonType = "regular",
                    Completed = true,
                    HomePoints = 28,
                    AwayPoints = 21,
                    StartDate = new DateTime(2023, 9, 2)
                }
            },
            RankedTeam = new RankedTeam
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
                Details = new TeamDetails()
            },
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
            }
        };

        _mockTeamsModule
            .Setup(x => x.GetTeamDetailAsync("Georgia", 2023, 5))
            .ReturnsAsync(teamDetailResult);

        var result = await _controller.GetTeamDetail("Georgia", 2023, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<TeamDetailResponseDTO>(okResult.Value);
        Assert.Equal("Georgia", response.TeamName);
        Assert.Equal(1, response.Rank);
        Assert.Equal(70.0, response.Rating);
        Assert.Equal("SEC", response.Conference);
    }
}
