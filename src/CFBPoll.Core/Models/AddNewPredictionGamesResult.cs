namespace CFBPoll.Core.Models;

public class AddNewPredictionGamesResult
{
    public int AddedGameCount { get; set; }

    public NewPredictionGamesOutcome Outcome { get; set; }

    /// <summary>
    /// The week after the games were added, when <see cref="Outcome"/> is <see cref="NewPredictionGamesOutcome.Success"/>.
    /// </summary>
    public GetPredictionsResult? Predictions { get; set; }
}
