namespace CFBPoll.API.DTOs;

public class ExperimentalPredictionsResponseDTO
{
    public string AlgorithmVersion { get; set; } = string.Empty;
    public IEnumerable<GamePredictionDTO> Predictions { get; set; } = [];
    public PredictionRecordSummaryDTO Summary { get; set; } = new();
}
