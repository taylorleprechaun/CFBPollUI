namespace CFBPoll.API.DTOs;

public class ExperimentalMatchupResponseDTO
{
    public IEnumerable<MatchupActualGameDTO> ActualGames { get; set; } = [];
    public string AlgorithmVersion { get; set; } = string.Empty;
    public GamePredictionDTO? Prediction { get; set; }
}
