using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class PredictionCalibrationModuleTests
{
    private static readonly IReadOnlyList<PredictionCalibrationParameter> Parameters =
    [
        new PredictionCalibrationParameter { DefaultValue = 0, Key = "paramA", Max = 5, Min = -5, Step = 0.1 },
        new PredictionCalibrationParameter { DefaultValue = 1, Key = "paramB", Max = 10, Min = -10, Step = 0.1 }
    ];

    private readonly Mock<IPredictionCalibrationData> _mockData;
    private readonly PredictionCalibrationModule _module;

    public PredictionCalibrationModuleTests()
    {
        _mockData = new Mock<IPredictionCalibrationData>();
        _module = new PredictionCalibrationModule(_mockData.Object);
    }

    [Fact]
    public void Constructor_NullData_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new PredictionCalibrationModule(null!));
    }

    [Fact]
    public async Task GetAsync_NoStoredRow_ReturnsNull()
    {
        _mockData.Setup(x => x.GetAsync(2025, 4)).ReturnsAsync((PredictionCalibration?)null);

        var result = await _module.GetAsync(2025, 4, Parameters);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAsync_StoredRowWithUnknownKey_DropsUnknownKeyAndFillsMissingDefault()
    {
        _mockData.Setup(x => x.GetAsync(2025, 4)).ReturnsAsync(CreateCalibration(2025, 4, ("paramA", 2), ("retiredParam", 9)));

        var result = await _module.GetAsync(2025, 4, Parameters);

        Assert.Equal(2, result!.Values["paramA"]);
        Assert.Equal(1, result.Values["paramB"]);
        Assert.False(result.Values.ContainsKey("retiredParam"));
    }

    [Fact]
    public async Task GetSeasonAsync_ReturnsStoredRows()
    {
        var rows = new List<PredictionCalibration> { CreateCalibration(2025, 2, ("paramA", 1)), CreateCalibration(2025, 3, ("paramA", 2)) };
        _mockData.Setup(x => x.GetSeasonAsync(2025)).ReturnsAsync(rows);

        var result = await _module.GetSeasonAsync(2025);

        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task ResolveEffectiveAsync_NoHistory_ReturnsDefaultsAsCarriedForward()
    {
        _mockData.Setup(x => x.GetAsync(2025, 1)).ReturnsAsync((PredictionCalibration?)null);
        _mockData.Setup(x => x.GetLatestBeforeAsync(2025, 1)).ReturnsAsync((PredictionCalibration?)null);

        var result = await _module.ResolveEffectiveAsync(2025, 1, Parameters);

        Assert.Equal(PredictionCalibrationSource.CarriedForward, result.Source);
        Assert.Equal(0, result.Values["paramA"]);
        Assert.Equal(1, result.Values["paramB"]);
        Assert.Equal(2025, result.Season);
        Assert.Equal(1, result.Week);
    }

    [Fact]
    public async Task ResolveEffectiveAsync_NoStoredRow_CarriesForwardEarlierValues()
    {
        _mockData.Setup(x => x.GetAsync(2025, 6)).ReturnsAsync((PredictionCalibration?)null);
        _mockData.Setup(x => x.GetLatestBeforeAsync(2025, 6)).ReturnsAsync(CreateCalibration(2025, 5, ("paramA", 1.5), ("paramB", -2)));

        var result = await _module.ResolveEffectiveAsync(2025, 6, Parameters);

        Assert.Equal(PredictionCalibrationSource.CarriedForward, result.Source);
        Assert.Equal(6, result.Week);
        Assert.Equal(1.5, result.Values["paramA"]);
        Assert.Equal(-2, result.Values["paramB"]);
        _mockData.Verify(x => x.SaveAsync(It.IsAny<PredictionCalibration>()), Times.Never);
    }

    [Fact]
    public async Task ResolveEffectiveAsync_NullParameters_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _module.ResolveEffectiveAsync(2025, 6, null!));
    }

    [Fact]
    public async Task ResolveEffectiveAsync_OutOfRangeValues_ClampsToParameterRange()
    {
        _mockData.Setup(x => x.GetAsync(2025, 6)).ReturnsAsync(CreateCalibration(2025, 6, ("paramA", 12), ("paramB", -40)));

        var result = await _module.ResolveEffectiveAsync(2025, 6, Parameters);

        Assert.Equal(5, result.Values["paramA"]);
        Assert.Equal(-10, result.Values["paramB"]);
    }

    [Fact]
    public async Task ResolveEffectiveAsync_StoredRow_ReturnsStoredWithItsSource()
    {
        var stored = CreateCalibration(2025, 6, ("paramA", 3), ("paramB", 4));
        stored.Source = PredictionCalibrationSource.Accepted;
        _mockData.Setup(x => x.GetAsync(2025, 6)).ReturnsAsync(stored);

        var result = await _module.ResolveEffectiveAsync(2025, 6, Parameters);

        Assert.Equal(PredictionCalibrationSource.Accepted, result.Source);
        Assert.Equal(3, result.Values["paramA"]);
        _mockData.Verify(x => x.GetLatestBeforeAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task SaveAsync_NullCalibration_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _module.SaveAsync(null!));
    }

    [Fact]
    public async Task SaveAsync_ValidCalibration_ReturnsDataResult()
    {
        var calibration = CreateCalibration(2025, 6, ("paramA", 1));
        _mockData.Setup(x => x.SaveAsync(calibration)).ReturnsAsync(true);

        var result = await _module.SaveAsync(calibration);

        Assert.True(result);
    }

    private static PredictionCalibration CreateCalibration(int season, int week, params (string Key, double Value)[] values)
    {
        return new PredictionCalibration
        {
            Season = season,
            Source = PredictionCalibrationSource.Manual,
            Values = values.ToDictionary(v => v.Key, v => v.Value),
            Week = week
        };
    }
}
