namespace CFBPoll.API.DTOs;

public class NewPredictionGamesPreviewDTO
{
    public IEnumerable<GamePredictionDTO> Games { get; set; } = [];
    public IEnumerable<NewPredictionGameWaitingDTO> WaitingOnLines { get; set; } = [];
}
