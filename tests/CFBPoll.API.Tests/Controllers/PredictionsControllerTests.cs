using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class PredictionsControllerTests
{
    private readonly PredictionsController _controller;
    private readonly Mock<ILogger<PredictionsController>> _mockLogger;
    private readonly Mock<IPredictionsModule> _mockPredictionsModule;
    public PredictionsControllerTests()
    {
        _mockLogger = new Mock<ILogger<PredictionsController>>();
        _mockPredictionsModule = new Mock<IPredictionsModule>();

        _controller = new PredictionsController(_mockPredictionsModule.Object, _mockLogger.Object);
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new PredictionsController(new Mock<IPredictionsModule>().Object, null!));
    }

    [Fact]
    public void Constructor_NullPredictionsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new PredictionsController(null!, new Mock<ILogger<PredictionsController>>().Object));
    }

    [Fact]
    public async Task GetPredictions_NotPublished_ReturnsNotFound()
    {
        _mockPredictionsModule
            .Setup(x => x.GetPublishedAsync(2024, 5))
            .ReturnsAsync(((PredictionsResult Predictions, bool ResultsPublished)?)null);

        var result = await _controller.GetPredictions(2024, 5);

        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        var response = Assert.IsType<ErrorResponseDTO>(notFoundResult.Value);
        Assert.Equal(404, response.StatusCode);
    }

    [Fact]
    public async Task GetPredictions_Published_ReturnsPredictions()
    {
        var published = new PredictionsResult
        {
            Season = 2024,
            Week = 5,
            Predictions =
            [
                new GamePrediction { HomeTeam = "Alabama", AwayTeam = "Florida", PredictedWinner = "Alabama" }
            ]
        };

        _mockPredictionsModule
            .Setup(x => x.GetPublishedAsync(2024, 5))
            .ReturnsAsync((published, false));

        var result = await _controller.GetPredictions(2024, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PredictionsResponseDTO>(okResult.Value);
        Assert.Equal(2024, response.Season);
        Assert.Equal(5, response.Week);
        Assert.Single(response.Predictions);
        Assert.Equal("Alabama", response.Predictions.First().PredictedWinner);
    }

    [Fact]
    public async Task GetPredictions_ResultsNotPublished_SuppressesGradeFields()
    {
        var published = new PredictionsResult
        {
            Season = 2024,
            Week = 5,
            Predictions =
            [
                new GamePrediction
                {
                    HomeTeam = "Alabama",
                    AwayTeam = "Florida",
                    PredictedWinner = "Alabama",
                    ActualWinner = "Alabama",
                    WinnerGrade = PredictionGradeStatus.Correct
                }
            ]
        };

        _mockPredictionsModule.Setup(x => x.GetPublishedAsync(2024, 5)).ReturnsAsync((published, false));

        var result = await _controller.GetPredictions(2024, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PredictionsResponseDTO>(okResult.Value);
        Assert.False(response.ResultsPublished);
        var prediction = Assert.Single(response.Predictions);
        Assert.Null(prediction.ActualWinner);
        Assert.Equal("Ungraded", prediction.WinnerGrade);
    }

    [Fact]
    public async Task GetPredictions_ResultsPublished_IncludesGradeFields()
    {
        var published = new PredictionsResult
        {
            Season = 2024,
            Week = 5,
            Predictions =
            [
                new GamePrediction
                {
                    HomeTeam = "Alabama",
                    AwayTeam = "Florida",
                    PredictedWinner = "Alabama",
                    ActualWinner = "Alabama",
                    WinnerGrade = PredictionGradeStatus.Correct
                }
            ]
        };

        _mockPredictionsModule.Setup(x => x.GetPublishedAsync(2024, 5)).ReturnsAsync((published, true));

        var result = await _controller.GetPredictions(2024, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PredictionsResponseDTO>(okResult.Value);
        Assert.True(response.ResultsPublished);
        var prediction = Assert.Single(response.Predictions);
        Assert.Equal("Alabama", prediction.ActualWinner);
        Assert.Equal("Correct", prediction.WinnerGrade);
    }
}
