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
    private readonly Mock<IAdminModule> _mockAdminModule;
    private readonly Mock<ILogger<AdminController>> _mockLogger;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly AdminController _controller;

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
            Persisted = true,
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
        Assert.True(response.Persisted);
        Assert.Equal(2024, response.Rankings.Season);
        var team = Assert.Single(response.Rankings.Rankings);
        Assert.Equal(2, team.RankDelta);
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
    public async Task GetSnapshots_ReturnsList()
    {
        var weeks = new List<SnapshotSummary>
        {
            new SnapshotSummary { Season = 2024, Week = 1, Published = true, CreatedAt = DateTime.UtcNow },
            new SnapshotSummary { Season = 2024, Week = 2, Published = false, CreatedAt = DateTime.UtcNow }
        };

        _mockAdminModule.Setup(x => x.GetSnapshotsAsync()).ReturnsAsync(weeks);

        var result = await _controller.GetSnapshots();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsAssignableFrom<IEnumerable<SnapshotDTO>>(okResult.Value);
        Assert.Equal(2, response.Count());
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
        Assert.Equal("Rankings_2024_Week5.xlsx", fileResult.FileDownloadName);
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
}
