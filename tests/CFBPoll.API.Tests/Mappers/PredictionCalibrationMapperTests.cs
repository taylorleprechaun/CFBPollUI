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
    public void ToAnalysisResponseDTO_MapsValuesNotesAndWeeks()
    {
        var used = new PredictionRecordSummary { GradedGameCount = 50 };
        used.Spread.Correct = 24;
        var suggested = new PredictionRecordSummary { GradedGameCount = 50 };
        suggested.Spread.Correct = 27;
        var candidate = new PredictionRecordSummary { GradedGameCount = 50 };
        candidate.Spread.Correct = 26;
        var analysis = new PredictionCalibrationAnalysis
        {
            BacktestWeeks =
            [
                new PredictionCalibrationBacktestWeek
                {
                    Candidate = candidate,
                    Season = 2026,
                    Suggested = suggested,
                    SuggestedValues = new Dictionary<string, double> { ["paramA"] = 1.2 },
                    Used = used,
                    UsedValues = new Dictionary<string, double> { ["paramA"] = 0 },
                    Week = 9
                }
            ],
            CandidateValues = new Dictionary<string, double> { ["paramA"] = 1 },
            SuggestionNotes = new Dictionary<string, string> { ["paramA"] = "Estimated from recent games." },
            SuggestedValues = new Dictionary<string, double> { ["paramA"] = 1.5 }
        };

        var result = PredictionCalibrationMapper.ToAnalysisResponseDTO(analysis);

        Assert.Equal(1, result.CandidateValues!["paramA"]);
        Assert.Equal(1.5, result.SuggestedValues["paramA"]);
        Assert.Equal("Estimated from recent games.", result.SuggestionNotes["paramA"]);
        var week = Assert.Single(result.BacktestWeeks);
        Assert.Equal(9, week.Week);
        Assert.Equal(0, week.UsedValues["paramA"]);
        Assert.Equal(1.2, week.SuggestedValues["paramA"]);
        Assert.Equal(24, week.Used.Spread.Correct);
        Assert.Equal(27, week.Suggested.Spread.Correct);
        Assert.Equal(26, week.Candidate!.Spread.Correct);
    }

    [Fact]
    public void ToAnalysisResponseDTO_NoCandidate_LeavesCandidateFieldsNull()
    {
        var analysis = new PredictionCalibrationAnalysis
        {
            BacktestWeeks = [new PredictionCalibrationBacktestWeek { Season = 2026, Week = 9 }]
        };

        var result = PredictionCalibrationMapper.ToAnalysisResponseDTO(analysis);

        Assert.Null(result.CandidateValues);
        Assert.Null(Assert.Single(result.BacktestWeeks).Candidate);
    }

    [Fact]
    public void ToAnalysisResponseDTO_NullAnalysis_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => PredictionCalibrationMapper.ToAnalysisResponseDTO(null!));
    }

    [Fact]
    public void ToHistoryEntryDTO_MapsCalibrationAndLockState()
    {
        var updatedAt = new DateTime(2026, 10, 3, 14, 0, 0, DateTimeKind.Utc);
        var entry = new PredictionCalibrationHistoryEntry
        {
            Calibration = new PredictionCalibration
            {
                CarriedFromSeason = 2026,
                CarriedFromWeek = 4,
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
        Assert.Equal(2026, result.CarriedFromSeason);
        Assert.Equal(4, result.CarriedFromWeek);
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
