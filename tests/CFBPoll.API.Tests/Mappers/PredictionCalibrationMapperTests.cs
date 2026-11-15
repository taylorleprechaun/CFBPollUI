using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class PredictionCalibrationMapperTests
{
    [Fact]
    public void PublicPredictionDTOs_DoNotExposeAppliedCalibration()
    {
        var publicTypes = new[] { typeof(PredictionsResponseDTO), typeof(GamePredictionDTO) };

        foreach (var type in publicTypes)
        {
            Assert.DoesNotContain(type.GetProperties(), p => p.Name.Contains("Calibration", StringComparison.OrdinalIgnoreCase));
        }
    }

    [Fact]
    public void ToHistoryEntryDTO_MapsCalibrationAndLockState()
    {
        var updatedAt = new DateTime(2026, 10, 3, 14, 0, 0, DateTimeKind.Utc);
        var entry = new PredictionCalibrationHistoryEntry
        {
            Calibration = new PredictionCalibration
            {
                Season = 2026,
                Source = PredictionCalibrationSource.CarriedForward,
                UpdatedAt = updatedAt,
                Values = new Dictionary<string, double> { ["paramA"] = -1.5 },
                Week = 6
            },
            IsLocked = true
        };

        var result = PredictionCalibrationMapper.ToHistoryEntryDTO(entry);

        Assert.True(result.IsLocked);
        Assert.Equal(2026, result.Season);
        Assert.Equal(6, result.Week);
        Assert.Equal("CarriedForward", result.Source);
        Assert.Equal(updatedAt, result.UpdatedAt);
        Assert.Equal(-1.5, result.Values["paramA"]);
    }

    [Fact]
    public void ToHistoryEntryDTO_NullEntry_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => PredictionCalibrationMapper.ToHistoryEntryDTO(null!));
    }

    [Fact]
    public void ToResponseDTO_NullView_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => PredictionCalibrationMapper.ToResponseDTO(null!));
    }

    [Fact]
    public void ToResponseDTO_SupportedView_MapsStateValuesAndParameters()
    {
        var view = new PredictionCalibrationView
        {
            Calibration = new PredictionCalibration
            {
                Season = 2026,
                Source = PredictionCalibrationSource.Accepted,
                Values = new Dictionary<string, double> { ["paramA"] = 2 },
                Week = 7
            },
            DraftUsesDifferentValues = true,
            IsLocked = false,
            IsStored = true,
            IsSupported = true,
            Parameters =
            [
                new PredictionCalibrationParameter { DefaultValue = 0, Description = "Desc", Key = "paramA", Label = "Param A", Max = 5, Min = -5, Step = 0.1 }
            ],
            Season = 2026,
            Week = 7
        };

        var result = PredictionCalibrationMapper.ToResponseDTO(view);

        Assert.True(result.DraftUsesDifferentValues);
        Assert.False(result.IsLocked);
        Assert.True(result.IsStored);
        Assert.True(result.IsSupported);
        Assert.Equal("Accepted", result.Source);
        Assert.Equal(2, result.Values["paramA"]);
        var parameter = Assert.Single(result.Parameters);
        Assert.Equal("Param A", parameter.Label);
        Assert.Equal(-5, parameter.Min);
        Assert.Equal(5, parameter.Max);
        Assert.Equal(0.1, parameter.Step);
    }

    [Fact]
    public void ToResponseDTO_UnsupportedView_ReturnsEmptyValuesAndNullSource()
    {
        var view = new PredictionCalibrationView { IsSupported = false, Season = 2024, Week = 3 };

        var result = PredictionCalibrationMapper.ToResponseDTO(view);

        Assert.False(result.IsSupported);
        Assert.Null(result.Source);
        Assert.Empty(result.Values);
        Assert.Empty(result.Parameters);
        Assert.Equal(2024, result.Season);
        Assert.Equal(3, result.Week);
    }
}
