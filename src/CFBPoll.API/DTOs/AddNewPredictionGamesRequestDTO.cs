namespace CFBPoll.API.DTOs;

public class AddNewPredictionGamesRequestDTO
{
    public IEnumerable<PredictionGameSelectionDTO>? Games { get; set; }
}
