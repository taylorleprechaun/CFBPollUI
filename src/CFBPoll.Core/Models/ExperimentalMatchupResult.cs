namespace CFBPoll.Core.Models;

public class ExperimentalMatchupResult
{
    public IReadOnlyList<MatchupActualGame> ActualGames { get; set; } = [];
    public RatingAlgorithmVersion AlgorithmVersion { get; set; }

    /// <summary>
    /// The calibration values the predictions were generated with, or null when the algorithm takes none.
    /// </summary>
    public IReadOnlyDictionary<string, double>? AppliedCalibration { get; set; }

    public ExperimentalMatchupOutcome Outcome { get; set; }
    public GamePrediction? Prediction { get; set; }
}
