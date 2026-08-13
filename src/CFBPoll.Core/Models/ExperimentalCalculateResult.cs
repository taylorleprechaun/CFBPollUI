namespace CFBPoll.Core.Models;

public class ExperimentalCalculateResult
{
    public RatingAlgorithmVersion AlgorithmVersion { get; set; }
    public RankingsResult Rankings { get; set; } = new();
}
