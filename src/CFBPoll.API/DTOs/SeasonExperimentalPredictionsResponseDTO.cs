namespace CFBPoll.API.DTOs;

public class SeasonExperimentalPredictionsResponseDTO
{
    public string AlgorithmVersion { get; set; } = string.Empty;
    public PredictionRecordSummaryDTO OverallSummary { get; set; } = new();
    public int Season { get; set; }
    public IEnumerable<SeasonExperimentalPredictionsWeekDTO> Weeks { get; set; } = [];
}
