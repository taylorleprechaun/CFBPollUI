using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class PredictionCalibrationValuesTests
{
    private static readonly IReadOnlyList<PredictionCalibrationParameter> Parameters =
    [
        new PredictionCalibrationParameter { DefaultValue = 0, Key = "paramA", Max = 5, Min = -5, Step = 0.1 },
        new PredictionCalibrationParameter { DefaultValue = 1, Key = "paramB", Max = 10, Min = -10, Step = 0.1 }
    ];

    [Fact]
    public void Defaults_Parameters_ReturnsEachDefault()
    {
        var result = PredictionCalibrationValues.Defaults(Parameters);

        Assert.Equal(0, result["paramA"]);
        Assert.Equal(1, result["paramB"]);
    }

    [Fact]
    public void Normalize_EmptyValues_ReturnsDefaults()
    {
        var result = PredictionCalibrationValues.Normalize(new Dictionary<string, double>(), Parameters);

        Assert.Equal(0, result["paramA"]);
        Assert.Equal(1, result["paramB"]);
    }

    [Fact]
    public void Normalize_NullValues_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => PredictionCalibrationValues.Normalize(null!, Parameters));
    }

    [Fact]
    public void Normalize_OutOfRangeAndUnknownKeys_ClampsAndDropsUnknown()
    {
        var values = new Dictionary<string, double> { ["paramA"] = 12, ["paramB"] = -40, ["retiredParam"] = 3 };

        var result = PredictionCalibrationValues.Normalize(values, Parameters);

        Assert.Equal(5, result["paramA"]);
        Assert.Equal(-10, result["paramB"]);
        Assert.False(result.ContainsKey("retiredParam"));
    }
}
