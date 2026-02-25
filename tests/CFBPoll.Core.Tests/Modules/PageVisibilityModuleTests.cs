using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class PageVisibilityModuleTests
{
    private readonly Mock<ILogger<PageVisibilityModule>> _mockLogger;
    private readonly Mock<IPageVisibilityData> _mockPageVisibilityData;
    private readonly PageVisibilityModule _module;

    public PageVisibilityModuleTests()
    {
        _mockLogger = new Mock<ILogger<PageVisibilityModule>>();
        _mockPageVisibilityData = new Mock<IPageVisibilityData>();

        _module = new PageVisibilityModule(
            _mockPageVisibilityData.Object,
            _mockLogger.Object);
    }

    [Fact]
    public void Constructor_NullPageVisibilityData_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new PageVisibilityModule(
                null!,
                new Mock<ILogger<PageVisibilityModule>>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new PageVisibilityModule(
                new Mock<IPageVisibilityData>().Object,
                null!));
    }

    [Fact]
    public async Task GetPageVisibilityAsync_DelegatesToData()
    {
        var expected = new PageVisibility
        {
            AllTimeEnabled = true,
            PollLeadersEnabled = false
        };

        _mockPageVisibilityData
            .Setup(x => x.GetPageVisibilityAsync())
            .ReturnsAsync(expected);

        var result = await _module.GetPageVisibilityAsync();

        Assert.Equal(expected.AllTimeEnabled, result.AllTimeEnabled);
        Assert.Equal(expected.PollLeadersEnabled, result.PollLeadersEnabled);
        _mockPageVisibilityData.Verify(x => x.GetPageVisibilityAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdatePageVisibilityAsync_DelegatesToData()
    {
        var visibility = new PageVisibility
        {
            AllTimeEnabled = false,
            PollLeadersEnabled = true
        };

        _mockPageVisibilityData
            .Setup(x => x.UpdatePageVisibilityAsync(visibility))
            .ReturnsAsync(true);

        var result = await _module.UpdatePageVisibilityAsync(visibility);

        Assert.True(result);
        _mockPageVisibilityData.Verify(x => x.UpdatePageVisibilityAsync(visibility), Times.Once);
    }

    [Fact]
    public async Task UpdatePageVisibilityAsync_ReturnsFalse_WhenDataReturnsFalse()
    {
        var visibility = new PageVisibility
        {
            AllTimeEnabled = true,
            PollLeadersEnabled = true
        };

        _mockPageVisibilityData
            .Setup(x => x.UpdatePageVisibilityAsync(visibility))
            .ReturnsAsync(false);

        var result = await _module.UpdatePageVisibilityAsync(visibility);

        Assert.False(result);
    }

    [Fact]
    public async Task GetPageVisibilityAsync_DataThrows_PropagatesException()
    {
        _mockPageVisibilityData
            .Setup(x => x.GetPageVisibilityAsync())
            .ThrowsAsync(new InvalidOperationException("Database unavailable"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _module.GetPageVisibilityAsync());
    }

    [Fact]
    public async Task UpdatePageVisibilityAsync_DataThrows_PropagatesException()
    {
        var visibility = new PageVisibility
        {
            AllTimeEnabled = true,
            PollLeadersEnabled = true
        };

        _mockPageVisibilityData
            .Setup(x => x.UpdatePageVisibilityAsync(visibility))
            .ThrowsAsync(new InvalidOperationException("Database unavailable"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _module.UpdatePageVisibilityAsync(visibility));
    }
}
