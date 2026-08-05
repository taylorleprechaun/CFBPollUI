namespace CFBPoll.API.DTOs;

public class PredictionsResponseDTO
{
    public bool IsGraded { get; set; }
    public IEnumerable<GamePredictionDTO> Predictions { get; set; } = [];
    public bool ResultsPublished { get; set; }
    public int Season { get; set; }
    public int Week { get; set; }
}
