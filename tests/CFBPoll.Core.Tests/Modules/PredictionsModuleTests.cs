using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class PredictionsModuleTests
{
    private readonly Mock<IPredictionsData> _mockPredictionsData;
    private readonly PredictionsModule _predictionsModule;

    public PredictionsModuleTests()
    {
        _mockPredictionsData = new Mock<IPredictionsData>();

        _predictionsModule = new PredictionsModule(_mockPredictionsData.Object);
    }

    [Fact]
    public void Constructor_ThrowsOnNull()
    {
        Assert.Throws<ArgumentNullException>(() => new PredictionsModule(null!));
    }

    [Fact]
    public async Task DeleteAsync_DelegatesToData()
    {
        _mockPredictionsData.Setup(x => x.DeleteAsync(2024, 5)).ReturnsAsync(true);

        var result = await _predictionsModule.DeleteAsync(2024, 5);

        Assert.True(result);
        _mockPredictionsData.Verify(x => x.DeleteAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task GetAsync_DelegatesToData()
    {
        var expected = new PredictionsResult { Season = 2024, Week = 5 };
        _mockPredictionsData.Setup(x => x.GetAsync(2024, 5)).ReturnsAsync(expected);

        var result = await _predictionsModule.GetAsync(2024, 5);

        Assert.Equal(expected, result);
        _mockPredictionsData.Verify(x => x.GetAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task GetAsync_ReturnsNull_WhenNotFound()
    {
        _mockPredictionsData.Setup(x => x.GetAsync(2024, 5)).ReturnsAsync((PredictionsResult?)null);

        var result = await _predictionsModule.GetAsync(2024, 5);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAllSummariesAsync_DelegatesToData()
    {
        var expected = new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 1, IsPublished = true, GameCount = 10 }
        };
        _mockPredictionsData.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(expected);

        var result = await _predictionsModule.GetAllSummariesAsync();

        Assert.Single(result);
        _mockPredictionsData.Verify(x => x.GetAllSummariesAsync(), Times.Once);
    }

    [Fact]
    public async Task PublishAsync_DelegatesToData()
    {
        _mockPredictionsData.Setup(x => x.PublishAsync(2024, 5)).ReturnsAsync(true);

        var result = await _predictionsModule.PublishAsync(2024, 5);

        Assert.True(result);
        _mockPredictionsData.Verify(x => x.PublishAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task SaveAsync_DelegatesToData()
    {
        var predictions = new PredictionsResult { Season = 2024, Week = 5 };
        _mockPredictionsData.Setup(x => x.SaveAsync(predictions)).ReturnsAsync(true);

        var result = await _predictionsModule.SaveAsync(predictions);

        Assert.True(result);
        _mockPredictionsData.Verify(x => x.SaveAsync(predictions), Times.Once);
    }

    [Fact]
    public async Task SaveAsync_ThrowsOnNull()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _predictionsModule.SaveAsync(null!));
    }
}
