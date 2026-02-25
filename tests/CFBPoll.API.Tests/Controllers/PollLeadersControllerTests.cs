using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class PollLeadersControllerTests
{
    private readonly Mock<ILogger<PollLeadersController>> _mockLogger;
    private readonly Mock<IPollLeadersModule> _mockPollLeadersModule;
    private readonly PollLeadersController _controller;

    public PollLeadersControllerTests()
    {
        _mockLogger = new Mock<ILogger<PollLeadersController>>();
        _mockPollLeadersModule = new Mock<IPollLeadersModule>();

        _controller = new PollLeadersController(
            _mockPollLeadersModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public void Constructor_NullPollLeadersModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new PollLeadersController(
                null!,
                new Mock<ILogger<PollLeadersController>>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new PollLeadersController(
                new Mock<IPollLeadersModule>().Object,
                null!));
    }

    [Fact]
    public async Task GetPollLeaders_ValidRequest_ReturnsOkWithMappedResponse()
    {
        var pollLeadersResult = new PollLeadersResult
        {
            AllWeeks = new List<PollLeaderEntry>
            {
                new()
                {
                    LogoURL = "https://example.com/alabama.png",
                    TeamName = "Alabama",
                    Top5Count = 10,
                    Top10Count = 15,
                    Top25Count = 20
                }
            },
            FinalWeeksOnly = new List<PollLeaderEntry>
            {
                new()
                {
                    LogoURL = "https://example.com/ohiostate.png",
                    TeamName = "Ohio State",
                    Top5Count = 5,
                    Top10Count = 8,
                    Top25Count = 12
                }
            },
            MaxAvailableSeason = 2023,
            MinAvailableSeason = 2020
        };

        _mockPollLeadersModule
            .Setup(x => x.GetPollLeadersAsync(2020, 2023))
            .ReturnsAsync(pollLeadersResult);

        var result = await _controller.GetPollLeaders(2020, 2023);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PollLeadersResponseDTO>(okResult.Value);

        Assert.Single(response.AllWeeks);
        Assert.Equal("Alabama", response.AllWeeks.First().TeamName);
        Assert.Equal(10, response.AllWeeks.First().Top5Count);
        Assert.Equal(15, response.AllWeeks.First().Top10Count);
        Assert.Equal(20, response.AllWeeks.First().Top25Count);

        Assert.Single(response.FinalWeeksOnly);
        Assert.Equal("Ohio State", response.FinalWeeksOnly.First().TeamName);

        Assert.Equal(2020, response.MinAvailableSeason);
        Assert.Equal(2023, response.MaxAvailableSeason);
    }

    [Fact]
    public async Task GetPollLeaders_NullParams_PassesNullToModule()
    {
        _mockPollLeadersModule
            .Setup(x => x.GetPollLeadersAsync(null, null))
            .ReturnsAsync(new PollLeadersResult());

        var result = await _controller.GetPollLeaders(null, null);

        Assert.IsType<OkObjectResult>(result.Result);
        _mockPollLeadersModule.Verify(x => x.GetPollLeadersAsync(null, null), Times.Once);
    }

    [Fact]
    public async Task GetPollLeaders_MinSeasonGreaterThanMaxSeason_ReturnsBadRequest()
    {
        var result = await _controller.GetPollLeaders(2024, 2020);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var errorResponse = Assert.IsType<ErrorResponseDTO>(badRequestResult.Value);
        Assert.Equal(400, errorResponse.StatusCode);
        Assert.Contains("minSeason", errorResponse.Message);

        _mockPollLeadersModule.Verify(
            x => x.GetPollLeadersAsync(It.IsAny<int?>(), It.IsAny<int?>()), Times.Never);
    }

    [Fact]
    public async Task GetPollLeaders_EqualMinAndMaxSeason_ReturnsOk()
    {
        _mockPollLeadersModule
            .Setup(x => x.GetPollLeadersAsync(2023, 2023))
            .ReturnsAsync(new PollLeadersResult());

        var result = await _controller.GetPollLeaders(2023, 2023);

        Assert.IsType<OkObjectResult>(result.Result);
        _mockPollLeadersModule.Verify(x => x.GetPollLeadersAsync(2023, 2023), Times.Once);
    }

    [Fact]
    public async Task GetPollLeaders_EmptyResult_ReturnsOkWithEmptyLists()
    {
        _mockPollLeadersModule
            .Setup(x => x.GetPollLeadersAsync(null, null))
            .ReturnsAsync(new PollLeadersResult());

        var result = await _controller.GetPollLeaders(null, null);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PollLeadersResponseDTO>(okResult.Value);

        Assert.Empty(response.AllWeeks);
        Assert.Empty(response.FinalWeeksOnly);
    }

    [Fact]
    public async Task GetPollLeaders_OnlyMinSeason_PassesMinSeasonWithNullMax()
    {
        _mockPollLeadersModule
            .Setup(x => x.GetPollLeadersAsync(2021, null))
            .ReturnsAsync(new PollLeadersResult());

        var result = await _controller.GetPollLeaders(2021, null);

        Assert.IsType<OkObjectResult>(result.Result);
        _mockPollLeadersModule.Verify(x => x.GetPollLeadersAsync(2021, null), Times.Once);
    }

    [Fact]
    public async Task GetPollLeaders_OnlyMaxSeason_PassesMaxSeasonWithNullMin()
    {
        _mockPollLeadersModule
            .Setup(x => x.GetPollLeadersAsync(null, 2023))
            .ReturnsAsync(new PollLeadersResult());

        var result = await _controller.GetPollLeaders(null, 2023);

        Assert.IsType<OkObjectResult>(result.Result);
        _mockPollLeadersModule.Verify(x => x.GetPollLeadersAsync(null, 2023), Times.Once);
    }
}
