using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class AdminControllerTests
{
    private readonly AdminController _controller;
    private readonly Mock<IAdminModule> _mockAdminModule;
    private readonly Mock<ILogger<AdminController>> _mockLogger;
    private readonly Mock<IRankingsModule> _mockRankingsModule;

    public AdminControllerTests()
    {
        _mockAdminModule = new Mock<IAdminModule>();
        _mockLogger = new Mock<ILogger<AdminController>>();
        _mockRankingsModule = new Mock<IRankingsModule>();

        _controller = new AdminController(_mockAdminModule.Object, _mockLogger.Object, _mockRankingsModule.Object);
    }

    [Fact]
    public async Task Calculate_ReturnsRankingsWithDeltas()
    {
        var rankedTeam = new RankedTeam { TeamName = "Ohio State", Rank = 1, Rating = 90, Details = new TeamDetails() };
        var calculateResult = new CalculateRankingsResult
        {
            IsPersisted = true,
            Rankings = new RankingsResult
            {
                Season = 2024,
                Week = 5,
                Rankings = [rankedTeam]
            }
        };

        var deltas = new Dictionary<string, int?> { { "Ohio State", 2 } };

        _mockAdminModule
            .Setup(x => x.CalculateRankingsAsync(2024, 5))
            .ReturnsAsync(calculateResult);

        _mockRankingsModule
            .Setup(x => x.GetRankDeltasAsync(2024, 5, It.IsAny<IEnumerable<RankedTeam>>()))
            .ReturnsAsync(deltas);

        var result = await _controller.Calculate(2024, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CalculateResponseDTO>(okResult.Value);
        Assert.True(response.IsPersisted);
        Assert.Equal(2024, response.Rankings.Season);
        var team = Assert.Single(response.Rankings.Rankings);
        Assert.Equal(2, team.RankDelta);
    }

    [Fact]
    public async Task CalculateExperimental_ReturnsRankings()
    {
        var rankedTeam = new RankedTeam { TeamName = "Ohio State", Rank = 1, Rating = 90, Details = new TeamDetails() };
        var experimentalResult = new ExperimentalCalculateResult
        {
            AlgorithmVersion = RatingAlgorithmVersion.V2,
            Rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [rankedTeam] }
        };

        _mockAdminModule
            .Setup(x => x.CalculateExperimentalAsync(2024, 5, RatingAlgorithmVersion.V2))
            .ReturnsAsync(experimentalResult);

        var result = await _controller.CalculateExperimental(2024, 5, RatingAlgorithmVersion.V2);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ExperimentalCalculateResponseDTO>(okResult.Value);
        Assert.Equal("V2", response.AlgorithmVersion);
        Assert.Equal(2024, response.Rankings.Season);
        var team = Assert.Single(response.Rankings.Rankings);
        Assert.Equal("Ohio State", team.TeamName);
    }

    [Fact]
    public async Task CalculateExperimentalPredictions_ReturnsGradedPredictionsWithSummary()
    {
        var experimentalResult = new ExperimentalPredictionsResult
        {
            AlgorithmVersion = RatingAlgorithmVersion.V2,
            Predictions =
            [
                new GamePrediction
                {
                    AwayTeam = "Michigan",
                    HomeTeam = "Ohio State",
                    PredictedWinner = "Ohio State",
                    PredictedMargin = 10.5,
                    ActualHomeScore = 28,
                    ActualAwayScore = 17,
                    WinnerGrade = PredictionGradeStatus.Correct
                }
            ],
            Summary = new PredictionRecordSummary
            {
                GradedGameCount = 1,
                MarginBias = -3.5,
                MarginMAE = 3.5,
                MarginRMSE = 3.5,
                Winner = new TrackRecordTotals { Correct = 1 }
            }
        };

        _mockAdminModule
            .Setup(x => x.CalculateExperimentalPredictionsAsync(2024, 5, RatingAlgorithmVersion.V2))
            .ReturnsAsync(experimentalResult);

        var result = await _controller.CalculateExperimentalPredictions(2024, 5, RatingAlgorithmVersion.V2);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ExperimentalPredictionsResponseDTO>(okResult.Value);
        Assert.Equal("V2", response.AlgorithmVersion);
        Assert.Equal(1, response.Summary.GradedGameCount);
        Assert.Equal(1, response.Summary.Winner.Correct);
        var prediction = Assert.Single(response.Predictions);
        Assert.Equal("Ohio State", prediction.PredictedWinner);
        Assert.Equal(28, prediction.ActualHomeScore);
    }

    [Fact]
    public async Task CalculateExperimentalSeasonPredictions_NullRequestBody_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _controller.CalculateExperimentalSeasonPredictions(2024, RatingAlgorithmVersion.V1, null!));
    }

    [Fact]
    public async Task CalculateExperimentalSeasonPredictions_ValidRequest_ReturnsOkWithMappedResponse()
    {
        var seasonResult = new SeasonExperimentalPredictionsResult
        {
            AlgorithmVersion = RatingAlgorithmVersion.V2,
            OverallSummary = new PredictionRecordSummary { GradedGameCount = 2, Winner = new TrackRecordTotals { Correct = 2 } },
            Season = 2024,
            Weeks =
            [
                new SeasonExperimentalPredictionsWeek { Summary = new PredictionRecordSummary { GradedGameCount = 1 }, Week = 5 },
                new SeasonExperimentalPredictionsWeek { Summary = new PredictionRecordSummary { GradedGameCount = 1 }, Week = 6 }
            ]
        };
        var request = new CalculateExperimentalSeasonPredictionsRequestDTO { Weeks = [5, 6] };

        _mockAdminModule
            .Setup(x => x.CalculateExperimentalSeasonPredictionsAsync(2024, request.Weeks, RatingAlgorithmVersion.V2))
            .ReturnsAsync(seasonResult);

        var result = await _controller.CalculateExperimentalSeasonPredictions(2024, RatingAlgorithmVersion.V2, request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<SeasonExperimentalPredictionsResponseDTO>(okResult.Value);
        Assert.Equal("V2", response.AlgorithmVersion);
        Assert.Equal(2024, response.Season);
        Assert.Equal(2, response.OverallSummary.GradedGameCount);
        Assert.Equal(2, response.Weeks.Count());
    }

    [Fact]
    public async Task CalculateExperimentalSeasonTrends_ReturnsSeasonTrendsResponseDTO()
    {
        var trendsResult = new SeasonTrendsResult
        {
            Season = 2024,
            Teams =
            [
                new SeasonTrendTeam
                {
                    TeamName = "Ohio State",
                    Rankings = [new SeasonTrendRanking { WeekNumber = 1, Rank = 1, Rating = 90, Record = "1-0" }]
                }
            ],
            Weeks = [new SeasonTrendWeek { WeekNumber = 1, Label = "Week 2" }]
        };

        _mockAdminModule
            .Setup(x => x.CalculateExperimentalSeasonTrendsAsync(2024, RatingAlgorithmVersion.V1))
            .ReturnsAsync(trendsResult);

        var result = await _controller.CalculateExperimentalSeasonTrends(2024, RatingAlgorithmVersion.V1);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<SeasonTrendsResponseDTO>(okResult.Value);
        Assert.Equal(2024, response.Season);
        var team = Assert.Single(response.Teams);
        Assert.Equal("Ohio State", team.TeamName);
    }

    [Fact]
    public async Task CalculatePredictions_ReturnsPredictions()
    {
        var calculateResult = new CalculatePredictionsResult
        {
            IsPersisted = true,
            Predictions = new PredictionsResult
            {
                Season = 2024,
                Week = 5,
                Predictions =
                [
                    new GamePrediction
                    {
                        AwayTeam = "Michigan",
                        AwayTeamScore = 17,
                        HomeTeam = "Ohio State",
                        HomeTeamScore = 28,
                        PredictedWinner = "Ohio State",
                        PredictedMargin = 10.5,
                        NeutralSite = false
                    }
                ]
            }
        };

        _mockAdminModule
            .Setup(x => x.CalculatePredictionsAsync(2024, 5))
            .ReturnsAsync(calculateResult);

        var result = await _controller.CalculatePredictions(2024, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CalculatePredictionsResponseDTO>(okResult.Value);
        Assert.True(response.IsPersisted);
        Assert.Equal(2024, response.Predictions.Season);
        Assert.Equal(5, response.Predictions.Week);
        var prediction = Assert.Single(response.Predictions.Predictions);
        Assert.Equal("Ohio State", prediction.PredictedWinner);
    }
    [Fact]
    public void Constructor_NullAdminModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminController(null!, new Mock<ILogger<AdminController>>().Object, new Mock<IRankingsModule>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminController(new Mock<IAdminModule>().Object, null!, new Mock<IRankingsModule>().Object));
    }

    [Fact]
    public void Constructor_NullRankingsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AdminController(new Mock<IAdminModule>().Object, new Mock<ILogger<AdminController>>().Object, null!));
    }

    [Fact]
    public async Task Delete_Found_ReturnsOk()
    {
        _mockAdminModule.Setup(x => x.DeleteSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _controller.Delete(2024, 5);

        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public async Task Delete_NotFound_ReturnsNotFound()
    {
        _mockAdminModule.Setup(x => x.DeleteSnapshotAsync(2024, 5)).ReturnsAsync(false);

        var result = await _controller.Delete(2024, 5);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task DeletePrediction_Found_ReturnsOk()
    {
        _mockAdminModule.Setup(x => x.DeletePredictionsAsync(2024, 5)).ReturnsAsync(true);

        var result = await _controller.DeletePrediction(2024, 5);

        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public async Task DeletePrediction_NotFound_ReturnsNotFound()
    {
        _mockAdminModule.Setup(x => x.DeletePredictionsAsync(2024, 5)).ReturnsAsync(false);

        var result = await _controller.DeletePrediction(2024, 5);

        Assert.IsType<NotFoundObjectResult>(result);
    }
    [Fact]
    public async Task Export_Found_ReturnsFile()
    {
        _mockAdminModule
            .Setup(x => x.ExportRankingsAsync(2024, 5))
            .ReturnsAsync(new byte[] { 1, 2, 3 });

        var result = await _controller.Export(2024, 5);

        var fileResult = Assert.IsType<FileContentResult>(result);
        Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileResult.ContentType);
        Assert.Equal("Rankings_2024_Week6.xlsx", fileResult.FileDownloadName);
    }

    [Fact]
    public async Task Export_NotFound_ReturnsNotFound()
    {
        _mockAdminModule
            .Setup(x => x.ExportRankingsAsync(2024, 5))
            .ReturnsAsync((byte[]?)null);

        var result = await _controller.Export(2024, 5);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task ExportExperimental_ReturnsFile()
    {
        _mockAdminModule
            .Setup(x => x.ExportExperimentalAsync(2024, 5, RatingAlgorithmVersion.V2))
            .ReturnsAsync(new byte[] { 1, 2, 3 });

        var result = await _controller.ExportExperimental(2024, 5, RatingAlgorithmVersion.V2);

        var fileResult = Assert.IsType<FileContentResult>(result);
        Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileResult.ContentType);
        Assert.Equal("Rankings_Experimental_V2_2024_Week6.xlsx", fileResult.FileDownloadName);
    }

    [Fact]
    public async Task GetCFBDUsage_ReturnsUsage()
    {
        var usage = new CFBDUsage { RemainingCalls = 150, TierName = "Patron" };

        _mockAdminModule.Setup(x => x.GetCFBDUsageAsync(false)).ReturnsAsync(usage);

        var result = await _controller.GetCFBDUsage();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CFBDUsageDTO>(okResult.Value);
        Assert.Equal(150, response.RemainingCalls);
        Assert.Equal("Patron", response.TierName);
    }

    [Fact]
    public async Task GetPrediction_NullResult_ReturnsNotFound()
    {
        _mockAdminModule.Setup(x => x.GetPredictionsAsync(2024, 5)).ReturnsAsync((GetPredictionsResult?)null);

        var result = await _controller.GetPrediction(2024, 5);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetPrediction_Success_ReturnsOk()
    {
        var getResult = new GetPredictionsResult
        {
            IsGraded = true,
            IsPublished = true,
            ResultsPublished = false,
            Predictions = new PredictionsResult
            {
                Season = 2024,
                Week = 5,
                Predictions =
                [
                    new GamePrediction
                    {
                        AwayTeam = "Michigan",
                        HomeTeam = "Ohio State",
                        PredictedWinner = "Ohio State",
                        WinnerGrade = PredictionGradeStatus.Correct
                    }
                ]
            }
        };

        _mockAdminModule.Setup(x => x.GetPredictionsAsync(2024, 5)).ReturnsAsync(getResult);

        var result = await _controller.GetPrediction(2024, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<AdminPredictionsResponseDTO>(okResult.Value);
        Assert.True(response.IsPublished);
        Assert.True(response.Predictions.IsGraded);
        Assert.False(response.Predictions.ResultsPublished);
        var prediction = Assert.Single(response.Predictions.Predictions);
        Assert.Equal("Correct", prediction.WinnerGrade);
    }

    [Fact]
    public async Task GetPredictions_ReturnsList()
    {
        var summaries = new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 1, IsPublished = true, CreatedAt = DateTime.UtcNow, GameCount = 10 },
            new() { Season = 2024, Week = 2, IsPublished = false, CreatedAt = DateTime.UtcNow, GameCount = 8 }
        };

        _mockAdminModule.Setup(x => x.GetPredictionsSummariesAsync()).ReturnsAsync(summaries);

        var result = await _controller.GetPredictions();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsAssignableFrom<IEnumerable<PredictionsSummaryDTO>>(okResult.Value);
        Assert.Equal(2, response.Count());
    }

    [Fact]
    public async Task GetSnapshots_ReturnsList()
    {
        var weeks = new List<SnapshotSummary>
        {
            new SnapshotSummary { Season = 2024, Week = 1, IsPublished = true, CreatedAt = DateTime.UtcNow },
            new SnapshotSummary { Season = 2024, Week = 2, IsPublished = false, CreatedAt = DateTime.UtcNow }
        };

        _mockAdminModule.Setup(x => x.GetSnapshotsAsync()).ReturnsAsync(weeks);

        var result = await _controller.GetSnapshots();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsAssignableFrom<IEnumerable<SnapshotDTO>>(okResult.Value);
        Assert.Equal(2, response.Count());
    }

    [Fact]
    public async Task GradePredictions_NullResult_ReturnsNotFound()
    {
        _mockAdminModule.Setup(x => x.GradePredictionsAsync(2024, 5)).ReturnsAsync((GradePredictionsResult?)null);

        var result = await _controller.GradePredictions(2024, 5);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GradePredictions_Success_ReturnsOk()
    {
        var gradeResult = new GradePredictionsResult
        {
            IsPersisted = true,
            Predictions = new PredictionsResult
            {
                Season = 2024,
                Week = 5,
                Predictions =
                [
                    new GamePrediction
                    {
                        AwayTeam = "Michigan",
                        HomeTeam = "Ohio State",
                        PredictedWinner = "Ohio State",
                        WinnerGrade = PredictionGradeStatus.Correct,
                        ActualWinner = "Ohio State"
                    }
                ]
            },
            UnmatchedGameCount = 0
        };

        _mockAdminModule.Setup(x => x.GradePredictionsAsync(2024, 5)).ReturnsAsync(gradeResult);

        var result = await _controller.GradePredictions(2024, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<GradePredictionsResponseDTO>(okResult.Value);
        Assert.True(response.IsPersisted);
        Assert.Equal(0, response.UnmatchedGameCount);
        var prediction = Assert.Single(response.Predictions.Predictions);
        Assert.Equal("Correct", prediction.WinnerGrade);
    }

    [Fact]
    public async Task PublishGradedResults_IsPublishedFalse_ReturnsBadRequest()
    {
        var result = await _controller.PublishGradedResults(2024, 5, new UpdateSnapshotDTO { IsPublished = false });

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var error = Assert.IsType<ErrorResponseDTO>(badRequestResult.Value);
        Assert.Equal(400, error.StatusCode);
        _mockAdminModule.Verify(x => x.PublishGradedResultsAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task PublishGradedResults_ModuleReturnsFalse_ReturnsNotFound()
    {
        _mockAdminModule.Setup(x => x.PublishGradedResultsAsync(2024, 5)).ReturnsAsync(false);

        var result = await _controller.PublishGradedResults(2024, 5, new UpdateSnapshotDTO { IsPublished = true });

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task PublishGradedResults_NullRequest_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _controller.PublishGradedResults(2024, 5, null!));
    }

    [Fact]
    public async Task PublishGradedResults_Success_ReturnsOk()
    {
        _mockAdminModule.Setup(x => x.PublishGradedResultsAsync(2024, 5)).ReturnsAsync(true);

        var result = await _controller.PublishGradedResults(2024, 5, new UpdateSnapshotDTO { IsPublished = true });

        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public async Task RefreshCache_DelegatesToAdminModuleWithCorrectSeasonAndWeek()
    {
        _mockAdminModule.Setup(x => x.RefreshSeasonCacheAsync(2024, 5)).ReturnsAsync(0);

        await _controller.RefreshCache(2024, 5);

        _mockAdminModule.Verify(x => x.RefreshSeasonCacheAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task RefreshCache_ReturnsOkWithRemovedCount()
    {
        _mockAdminModule.Setup(x => x.RefreshSeasonCacheAsync(2024, 5)).ReturnsAsync(8);

        var result = await _controller.RefreshCache(2024, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RefreshCacheResponseDTO>(okResult.Value);
        Assert.Equal(8, response.RemovedCount);
        Assert.Equal(2024, response.Season);
        Assert.Equal(5, response.Week);
    }

    [Fact]
    public async Task RefreshCache_ZeroRemoved_StillReturnsOk()
    {
        _mockAdminModule.Setup(x => x.RefreshSeasonCacheAsync(2024, 5)).ReturnsAsync(0);

        var result = await _controller.RefreshCache(2024, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RefreshCacheResponseDTO>(okResult.Value);
        Assert.Equal(0, response.RemovedCount);
    }

    [Fact]
    public async Task UpdatePrediction_Found_ReturnsOk()
    {
        _mockAdminModule.Setup(x => x.PublishPredictionsAsync(2024, 5)).ReturnsAsync(true);

        var result = await _controller.UpdatePrediction(2024, 5, new UpdateSnapshotDTO { IsPublished = true });

        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public async Task UpdatePrediction_NotFound_ReturnsNotFound()
    {
        _mockAdminModule.Setup(x => x.PublishPredictionsAsync(2024, 5)).ReturnsAsync(false);

        var result = await _controller.UpdatePrediction(2024, 5, new UpdateSnapshotDTO { IsPublished = true });

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task UpdatePrediction_NullRequest_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _controller.UpdatePrediction(2024, 5, null!));
    }

    [Fact]
    public async Task UpdatePrediction_PublishedFalse_ReturnsBadRequest()
    {
        var result = await _controller.UpdatePrediction(2024, 5, new UpdateSnapshotDTO { IsPublished = false });

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var error = Assert.IsType<ErrorResponseDTO>(badRequestResult.Value);
        Assert.Equal(400, error.StatusCode);
        _mockAdminModule.Verify(x => x.PublishPredictionsAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task UpdateSnapshot_Found_ReturnsOk()
    {
        _mockAdminModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _controller.UpdateSnapshot(2024, 5, new UpdateSnapshotDTO { IsPublished = true });

        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public async Task UpdateSnapshot_NotFound_ReturnsNotFound()
    {
        _mockAdminModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(false);

        var result = await _controller.UpdateSnapshot(2024, 5, new UpdateSnapshotDTO { IsPublished = true });

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task UpdateSnapshot_NullRequest_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _controller.UpdateSnapshot(2024, 5, null!));
    }

    [Fact]
    public async Task UpdateSnapshot_PublishedFalse_ReturnsBadRequest()
    {
        var result = await _controller.UpdateSnapshot(2024, 5, new UpdateSnapshotDTO { IsPublished = false });

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var error = Assert.IsType<ErrorResponseDTO>(badRequestResult.Value);
        Assert.Equal(400, error.StatusCode);
        _mockAdminModule.Verify(x => x.PublishSnapshotAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }
}
