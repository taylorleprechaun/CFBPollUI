namespace CFBPoll.Core.Models;

/// <summary>
/// The score overrides that were embedded in a persisted rankings snapshot when it was calculated.
/// </summary>
public class RankingsSnapshotScoreOverrides
{
    public IEnumerable<AppliedScoreOverride> ScoreOverrides { get; set; } = [];
    public int Season { get; set; }
    public int Week { get; set; }
}
