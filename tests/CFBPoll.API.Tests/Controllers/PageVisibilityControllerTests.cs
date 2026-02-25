using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class PageVisibilityControllerTests
{
    private readonly Mock<ILogger<PageVisibilityController>> _mockLogger;
    private readonly Mock<IPageVisibilityModule> _mockPageVisibilityModule;
    private readonly PageVisibilityController _controller;

    public PageVisibilityControllerTests()
    {
        _mockLogger = new Mock<ILogger<PageVisibilityController>>();
        _mockPageVisibilityModule = new Mock<IPageVisibilityModule>();

        _controller = new PageVisibilityController(
            _mockPageVisibilityModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public void Constructor_NullPageVisibilityModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new PageVisibilityController(
                null!,
                new Mock<ILogger<PageVisibilityController>>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new PageVisibilityController(
                new Mock<IPageVisibilityModule>().Object,
                null!));
    }

    [Fact]
    public async Task GetPageVisibility_ReturnsOkWithMappedDTO()
    {
        var visibility = new PageVisibility
        {
            AllTimeEnabled = true,
            PollLeadersEnabled = false
        };

        _mockPageVisibilityModule
            .Setup(x => x.GetPageVisibilityAsync())
            .ReturnsAsync(visibility);

        var result = await _controller.GetPageVisibility();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PageVisibilityDTO>(okResult.Value);

        Assert.True(response.AllTimeEnabled);
        Assert.False(response.PollLeadersEnabled);
    }

    [Fact]
    public async Task GetPageVisibility_AllDisabled_ReturnsOkWithFalseValues()
    {
        var visibility = new PageVisibility
        {
            AllTimeEnabled = false,
            PollLeadersEnabled = false
        };

        _mockPageVisibilityModule
            .Setup(x => x.GetPageVisibilityAsync())
            .ReturnsAsync(visibility);

        var result = await _controller.GetPageVisibility();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PageVisibilityDTO>(okResult.Value);

        Assert.False(response.AllTimeEnabled);
        Assert.False(response.PollLeadersEnabled);
    }

    [Fact]
    public async Task UpdatePageVisibility_ValidDTO_ReturnsOkWithPersistedState()
    {
        var dto = new PageVisibilityDTO
        {
            AllTimeEnabled = false,
            PollLeadersEnabled = true
        };

        var persistedVisibility = new PageVisibility
        {
            AllTimeEnabled = false,
            PollLeadersEnabled = true
        };

        _mockPageVisibilityModule
            .Setup(x => x.UpdatePageVisibilityAsync(It.IsAny<PageVisibility>()))
            .ReturnsAsync(true);

        _mockPageVisibilityModule
            .Setup(x => x.GetPageVisibilityAsync())
            .ReturnsAsync(persistedVisibility);

        var result = await _controller.UpdatePageVisibility(dto);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PageVisibilityDTO>(okResult.Value);

        Assert.False(response.AllTimeEnabled);
        Assert.True(response.PollLeadersEnabled);
    }

    [Fact]
    public async Task UpdatePageVisibility_UpdateFails_ReturnsServerError()
    {
        var dto = new PageVisibilityDTO
        {
            AllTimeEnabled = true,
            PollLeadersEnabled = false
        };

        _mockPageVisibilityModule
            .Setup(x => x.UpdatePageVisibilityAsync(It.IsAny<PageVisibility>()))
            .ReturnsAsync(false);

        var result = await _controller.UpdatePageVisibility(dto);

        var statusResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, statusResult.StatusCode);
        var error = Assert.IsType<ErrorResponseDTO>(statusResult.Value);
        Assert.Equal("Failed to update page visibility", error.Message);
    }

    [Fact]
    public async Task UpdatePageVisibility_NullDTO_ReturnsBadRequest()
    {
        var result = await _controller.UpdatePageVisibility(null);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var error = Assert.IsType<ErrorResponseDTO>(badRequestResult.Value);

        Assert.Equal(400, error.StatusCode);
        Assert.Equal("Request body is required", error.Message);
    }

    [Fact]
    public async Task UpdatePageVisibility_CallsModuleWithMappedModel()
    {
        var dto = new PageVisibilityDTO
        {
            AllTimeEnabled = true,
            PollLeadersEnabled = false
        };

        _mockPageVisibilityModule
            .Setup(x => x.UpdatePageVisibilityAsync(It.IsAny<PageVisibility>()))
            .ReturnsAsync(true);

        _mockPageVisibilityModule
            .Setup(x => x.GetPageVisibilityAsync())
            .ReturnsAsync(new PageVisibility { AllTimeEnabled = true, PollLeadersEnabled = false });

        await _controller.UpdatePageVisibility(dto);

        _mockPageVisibilityModule.Verify(
            x => x.UpdatePageVisibilityAsync(It.Is<PageVisibility>(
                v => v.AllTimeEnabled == true && v.PollLeadersEnabled == false)),
            Times.Once);
    }
}
