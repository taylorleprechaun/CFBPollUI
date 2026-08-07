using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class TrackRecordControllerTests
{
    private readonly TrackRecordController _controller;
    private readonly Mock<ILogger<TrackRecordController>> _mockLogger;
    private readonly Mock<ITrackRecordModule> _mockTrackRecordModule;

    public TrackRecordControllerTests()
    {
        _mockLogger = new Mock<ILogger<TrackRecordController>>();
        _mockTrackRecordModule = new Mock<ITrackRecordModule>();

        _controller = new TrackRecordController(
            _mockTrackRecordModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new TrackRecordController(
                new Mock<ITrackRecordModule>().Object,
                null!));
    }

    [Fact]
    public void Constructor_NullTrackRecordModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new TrackRecordController(
                null!,
                new Mock<ILogger<TrackRecordController>>().Object));
    }

    [Fact]
    public async Task GetTrackRecord_CallsModuleOnce()
    {
        _mockTrackRecordModule.Setup(x => x.GetTrackRecordAsync()).ReturnsAsync(new TrackRecordResult());

        await _controller.GetTrackRecord();

        _mockTrackRecordModule.Verify(x => x.GetTrackRecordAsync(), Times.Once);
    }

    [Fact]
    public async Task GetTrackRecord_EmptyResult_ReturnsOkWithEmptyWeeks()
    {
        _mockTrackRecordModule.Setup(x => x.GetTrackRecordAsync()).ReturnsAsync(new TrackRecordResult());

        var result = await _controller.GetTrackRecord();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<TrackRecordResponseDTO>(okResult.Value);

        Assert.Empty(response.Weeks);
    }

    [Fact]
    public async Task GetTrackRecord_ValidRequest_ReturnsOkWithMappedResponse()
    {
        var trackRecordResult = new TrackRecordResult
        {
            OverallOverUnder = new TrackRecordTotals { Correct = 10, Incorrect = 8, Push = 1 },
            OverallSpread = new TrackRecordTotals { Correct = 12, Incorrect = 6 },
            OverallWinner = new TrackRecordTotals { Correct = 15, Incorrect = 3 },
            Weeks = new List<TrackRecordWeek>
            {
                new()
                {
                    OverUnder = new TrackRecordTotals { Correct = 5 },
                    Season = 2024,
                    Spread = new TrackRecordTotals { Correct = 4 },
                    Week = 3,
                    Winner = new TrackRecordTotals { Correct = 6 }
                }
            }
        };

        _mockTrackRecordModule.Setup(x => x.GetTrackRecordAsync()).ReturnsAsync(trackRecordResult);

        var result = await _controller.GetTrackRecord();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<TrackRecordResponseDTO>(okResult.Value);

        Assert.Equal(15, response.OverallWinner.Correct);
        Assert.Equal(12, response.OverallSpread.Correct);
        Assert.Equal(10, response.OverallOverUnder.Correct);
        Assert.Single(response.Weeks);
        Assert.Equal(2024, response.Weeks.First().Season);
        Assert.Equal(3, response.Weeks.First().Week);
    }
}
