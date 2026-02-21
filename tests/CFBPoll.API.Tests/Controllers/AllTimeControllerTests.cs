using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class AllTimeControllerTests
{
    private readonly Mock<IAllTimeModule> _mockAllTimeModule;
    private readonly Mock<ILogger<AllTimeController>> _mockLogger;
    private readonly AllTimeController _controller;

    public AllTimeControllerTests()
    {
        _mockAllTimeModule = new Mock<IAllTimeModule>();
        _mockLogger = new Mock<ILogger<AllTimeController>>();

        _controller = new AllTimeController(
            _mockAllTimeModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public void Constructor_NullAllTimeModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AllTimeController(
                null!,
                new Mock<ILogger<AllTimeController>>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AllTimeController(
                new Mock<IAllTimeModule>().Object,
                null!));
    }

    [Fact]
    public async Task GetAllTimeRankings_ReturnsOkWithMappedResponse()
    {
        var allTimeResult = new AllTimeResult
        {
            BestTeams = new List<AllTimeEntry>
            {
                new()
                {
                    AllTimeRank = 1,
                    Losses = 0,
                    Rank = 1,
                    Rating = 55.0,
                    Season = 2023,
                    TeamName = "Team A",
                    WeightedSOS = 0.8,
                    Week = 5,
                    Wins = 12
                }
            },
            HardestSchedules = new List<AllTimeEntry>
            {
                new()
                {
                    AllTimeRank = 1,
                    Losses = 3,
                    Rank = 5,
                    Rating = 35.0,
                    Season = 2022,
                    TeamName = "Team B",
                    WeightedSOS = 0.95,
                    Week = 5,
                    Wins = 8
                }
            },
            WorstTeams = new List<AllTimeEntry>
            {
                new()
                {
                    AllTimeRank = 1,
                    Losses = 12,
                    Rank = 130,
                    Rating = 5.0,
                    Season = 2021,
                    TeamName = "Team C",
                    WeightedSOS = 0.3,
                    Week = 5,
                    Wins = 0
                }
            }
        };

        _mockAllTimeModule
            .Setup(x => x.GetAllTimeRankingsAsync())
            .ReturnsAsync(allTimeResult);

        var result = await _controller.GetAllTimeRankings();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<AllTimeResponseDTO>(okResult.Value);

        Assert.Single(response.BestTeams);
        Assert.Equal("Team A", response.BestTeams.First().TeamName);
        Assert.Equal("12-0", response.BestTeams.First().Record);

        Assert.Single(response.HardestSchedules);
        Assert.Equal("Team B", response.HardestSchedules.First().TeamName);

        Assert.Single(response.WorstTeams);
        Assert.Equal("Team C", response.WorstTeams.First().TeamName);
    }

    [Fact]
    public async Task GetAllTimeRankings_EmptyResult_ReturnsOkWithEmptyLists()
    {
        _mockAllTimeModule
            .Setup(x => x.GetAllTimeRankingsAsync())
            .ReturnsAsync(new AllTimeResult());

        var result = await _controller.GetAllTimeRankings();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<AllTimeResponseDTO>(okResult.Value);

        Assert.Empty(response.BestTeams);
        Assert.Empty(response.HardestSchedules);
        Assert.Empty(response.WorstTeams);
    }
}
