namespace CFBPoll.API.DTOs;

public class PredictionCalibrationAnalysisResponseDTO
{
    public IEnumerable<PredictionCalibrationBacktestWeekDTO> BacktestWeeks { get; set; } = [];
    public IDictionary<string, double>? CandidateValues { get; set; }
    public IDictionary<string, string> SuggestionNotes { get; set; } = new Dictionary<string, string>();
    public IDictionary<string, double> SuggestedValues { get; set; } = new Dictionary<string, double>();
}
