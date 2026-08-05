namespace CFBPoll.API.DTOs;

public class GradePredictionsResponseDTO
{
    public bool IsPersisted { get; set; }
    public PredictionsResponseDTO Predictions { get; set; } = new();
    public int UnmatchedGameCount { get; set; }
}
