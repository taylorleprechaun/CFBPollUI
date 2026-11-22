namespace CFBPoll.API.DTOs;

public class AddNewPredictionGamesRequestDTO
{
    /// <summary>
    /// Predictions for the games to add, as returned by the new-games preview.
    /// </summary>
    public IEnumerable<GamePredictionDTO>? Games { get; set; }
}
