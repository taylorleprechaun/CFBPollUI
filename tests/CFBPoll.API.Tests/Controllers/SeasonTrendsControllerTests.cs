using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class SeasonTrendsControllerTests
{
    private readonly Mock<ILogger<SeasonTrendsController>> _mockLogger;
    private readonly Mock<ISeasonTrendsModule> _mockSeasonTrendsModule;
    private readonly SeasonTrendsController _controller;

    public SeasonTrendsControllerTests()
    {
        _mockLogger = new Mock<ILogger<SeasonTrendsController>>();
        _mockSeasonTrendsModule = new Mock<ISeasonTrendsModule>();

        _controller = new SeasonTrendsController(
            _mockSeasonTrendsModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public void Constructor_NullSeasonTrendsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonTrendsController(
                null!,
                new Mock<ILogger<SeasonTrendsController>>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonTrendsController(
                new Mock<ISeasonTrendsModule>().Object,
                null!));
    }

    [Fact]
    public async Task GetSeasonTrends_ValidRequest_ReturnsOkWithMappedResponse()
    {
        var trendsResult = new SeasonTrendsResult
        {
            Season = 2024,
            Teams = new List<SeasonTrendTeam>
            {
                new()
                {
                    AltColor = "#FFFFFF",
                    Color = "#BB0000",
                    Conference = "Big Ten",
                    LogoURL = "https://example.com/ohio-state.png",
                    Rankings = new List<SeasonTrendRanking>
                    {
                        new() { Rank = 1, Rating = 95.0, Record = "8-0", WeekNumber = 1 }
                    },
                    TeamName = "Ohio State"
                }
            },
            Weeks = new List<SeasonTrendWeek>
            {
                new() { Label = "Week 2", WeekNumber = 1 }
            }
        };

        _mockSeasonTrendsModule
            .Setup(x => x.GetSeasonTrendsAsync(2024))
            .ReturnsAsync(trendsResult);

        var result = await _controller.GetSeasonTrends(2024);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<SeasonTrendsResponseDTO>(okResult.Value);

        Assert.Equal(2024, response.Season);
        Assert.Single(response.Teams);
        Assert.Equal("Ohio State", response.Teams.First().TeamName);
        Assert.Equal("#BB0000", response.Teams.First().Color);
        Assert.Single(response.Teams.First().Rankings);
        Assert.Equal(1, response.Teams.First().Rankings.First().Rank);
        Assert.Single(response.Weeks);
        Assert.Equal("Week 2", response.Weeks.First().Label);
    }

    [Fact]
    public async Task GetSeasonTrends_EmptyResult_ReturnsOkWithEmptyTeams()
    {
        _mockSeasonTrendsModule
            .Setup(x => x.GetSeasonTrendsAsync(2024))
            .ReturnsAsync(new SeasonTrendsResult { Season = 2024 });

        var result = await _controller.GetSeasonTrends(2024);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<SeasonTrendsResponseDTO>(okResult.Value);

        Assert.Equal(2024, response.Season);
        Assert.Empty(response.Teams);
        Assert.Empty(response.Weeks);
    }
}
