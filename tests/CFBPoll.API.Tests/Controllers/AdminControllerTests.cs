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
    private readonly AdminController _controller;

    public AdminControllerTests()
    {
        _mockAdminModule = new Mock<IAdminModule>();
        _mockLogger = new Mock<ILogger<AdminController>>();

        _controller = new AdminController(_mockAdminModule.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task Calculate_ReturnsRankings()
    {
        var calculateResult = new CalculateRankingsResult
        {
            Persisted = true,
            Rankings = new RankingsResult
            {
                Season = 2024,
                Week = 5,
                Rankings =
                [
                    new RankedTeam { TeamName = "Team A", Rank = 1, Rating = 90, Details = new TeamDetails() }
                ]
            }
        };

        _mockAdminModule
            .Setup(x => x.CalculateRankingsAsync(2024, 5))
            .ReturnsAsync(calculateResult);

        var request = new CalculateRequestDTO { Season = 2024, Week = 5 };
        var result = await _controller.Calculate(request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CalculateResponseDTO>(okResult.Value);
        Assert.True(response.Persisted);
        Assert.Equal(2024, response.Rankings.Season);
        Assert.Single(response.Rankings.Rankings);
    }

    [Fact]
    public async Task Publish_Found_ReturnsOk()
    {
        _mockAdminModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _controller.Publish(2024, 5);

        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public async Task Publish_NotFound_ReturnsNotFound()
    {
        _mockAdminModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(false);

        var result = await _controller.Publish(2024, 5);

        Assert.IsType<NotFoundObjectResult>(result);
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
    public async Task GetPersistedWeeks_ReturnsList()
    {
        var weeks = new List<PersistedWeekSummary>
        {
            new PersistedWeekSummary { Season = 2024, Week = 1, Published = true, CreatedAt = DateTime.UtcNow },
            new PersistedWeekSummary { Season = 2024, Week = 2, Published = false, CreatedAt = DateTime.UtcNow }
        };

        _mockAdminModule.Setup(x => x.GetPersistedWeeksAsync()).ReturnsAsync(weeks);

        var result = await _controller.GetPersistedWeeks();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsAssignableFrom<IEnumerable<PersistedWeekDTO>>(okResult.Value);
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
}
