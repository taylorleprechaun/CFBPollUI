namespace CFBPoll.API.DTOs;

public class AdminPredictionsResponseDTO
{
    public bool IsPostseason { get; set; }
    public bool IsPublished { get; set; }
    public PredictionsResponseDTO Predictions { get; set; } = new();
}
