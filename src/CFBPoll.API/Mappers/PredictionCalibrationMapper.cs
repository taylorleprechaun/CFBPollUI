using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class PredictionCalibrationMapper
{
    public static PredictionCalibrationAnalysisResponseDTO ToAnalysisResponseDTO(PredictionCalibrationAnalysis analysis)
    {
        ArgumentNullException.ThrowIfNull(analysis);

        return new PredictionCalibrationAnalysisResponseDTO
        {
            BacktestWeeks = analysis.BacktestWeeks.Select(w => new PredictionCalibrationBacktestWeekDTO
            {
                Candidate = PredictionsMapper.ToDTO(w.Candidate),
                Season = w.Season,
                Used = PredictionsMapper.ToDTO(w.Used),
                UsedValues = w.UsedValues.ToDictionary(v => v.Key, v => v.Value),
                Week = w.Week
            }).ToList(),
            CandidateTotal = PredictionsMapper.ToDTO(analysis.CandidateTotal),
            CandidateValues = analysis.CandidateValues.ToDictionary(v => v.Key, v => v.Value),
            SuggestionNotes = analysis.SuggestionNotes.ToDictionary(v => v.Key, v => v.Value),
            SuggestedValues = analysis.SuggestedValues.ToDictionary(v => v.Key, v => v.Value),
            UsedTotal = PredictionsMapper.ToDTO(analysis.UsedTotal)
        };
    }

    public static PredictionCalibrationHistoryEntryDTO ToHistoryEntryDTO(PredictionCalibrationHistoryEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);

        return new PredictionCalibrationHistoryEntryDTO
        {
            CarriedFromSeason = entry.Calibration.CarriedFromSeason,
            CarriedFromWeek = entry.Calibration.CarriedFromWeek,
            IsLocked = entry.IsLocked,
            Season = entry.Calibration.Season,
            Source = entry.Calibration.Source.ToString(),
            UpdatedAt = entry.Calibration.UpdatedAt,
            Values = entry.Calibration.Values.ToDictionary(v => v.Key, v => v.Value),
            Week = entry.Calibration.Week
        };
    }

    public static PredictionCalibrationResponseDTO ToResponseDTO(PredictionCalibrationView view)
    {
        ArgumentNullException.ThrowIfNull(view);

        return new PredictionCalibrationResponseDTO
        {
            CarriedFromSeason = view.Calibration?.CarriedFromSeason,
            CarriedFromWeek = view.Calibration?.CarriedFromWeek,
            DraftUsesDifferentValues = view.DraftUsesDifferentValues,
            IsLocked = view.IsLocked,
            IsStored = view.IsStored,
            IsSupported = view.IsSupported,
            Parameters = view.Parameters.Select(ToParameterDTO).ToList(),
            Season = view.Season,
            Source = view.Calibration?.Source.ToString(),
            UpdatedAt = view.Calibration?.UpdatedAt,
            Values = view.Calibration?.Values.ToDictionary(v => v.Key, v => v.Value) ?? new Dictionary<string, double>(),
            Week = view.Week
        };
    }

    private static PredictionCalibrationParameterDTO ToParameterDTO(PredictionCalibrationParameter parameter)
    {
        return new PredictionCalibrationParameterDTO
        {
            DefaultValue = parameter.DefaultValue,
            Description = parameter.Description,
            Key = parameter.Key,
            Label = parameter.Label,
            Max = parameter.Max,
            Min = parameter.Min,
            Step = parameter.Step
        };
    }
}
