namespace CFBPoll.API.DTOs;

public class PredictionsResponseDTO
{
    public IEnumerable<GamePredictionDTO> Predictions { get; set; } = [];
    public int Season { get; set; }
    public int Week { get; set; }
}
