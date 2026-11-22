namespace CFBPoll.Core.Models;

/// <summary>
/// Postseason games scheduled since a week's predictions were saved that haven't kicked off yet.
/// </summary>
public class NewPredictionGamesPreview
{
    /// <summary>
    /// Predictions for the new games that have a betting line, ordered by kickoff.
    /// </summary>
    public IEnumerable<GamePrediction> Games { get; set; } = [];

    public NewPredictionGamesOutcome Outcome { get; set; }

    /// <summary>
    /// New games with no betting line yet. They can't be added until one exists.
    /// </summary>
    public IEnumerable<ScheduleGame> WaitingOnLines { get; set; } = [];
}
