namespace CFBPoll.API.DTOs;

public class CalculatePredictionsResponseDTO
{
    public bool IsPersisted { get; set; }
    public PredictionsResponseDTO Predictions { get; set; } = new();
}
