namespace CFBPoll.Core.Models;

public class ExperimentalMatchupResult
{
    public IReadOnlyList<MatchupActualGame> ActualGames { get; set; } = [];
    public RatingAlgorithmVersion AlgorithmVersion { get; set; }
    public ExperimentalMatchupOutcome Outcome { get; set; }
    public GamePrediction? Prediction { get; set; }
}
