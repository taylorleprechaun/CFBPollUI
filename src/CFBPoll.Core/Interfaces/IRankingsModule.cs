using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for generating complete rankings from team ratings and managing persisted rankings data.
/// </summary>
public interface IRankingsModule
{
    /// <summary>
    /// Deletes a rankings snapshot for the given season and week.
    /// </summary>
    Task<bool> DeleteRankingsSnapshotAsync(int season, int week);

    /// <summary>
    /// Generates complete rankings from season data and calculated ratings.
    /// </summary>
    /// <param name="seasonData">The season data containing teams and game results.</param>
    /// <param name="ratings">Dictionary mapping team names to their calculated rating details.</param>
    /// <returns>Rankings result containing all ranked teams.</returns>
    Task<RankingsResult> GenerateRankingsAsync(SeasonData seasonData, IDictionary<string, RatingDetails> ratings);

    /// <summary>
    /// Retrieves a published rankings snapshot for the given season and week.
    /// </summary>
    Task<RankingsResult?> GetPublishedRankingsSnapshotAsync(int season, int week);

    /// <summary>
    /// Retrieves all published rankings snapshots within the given season range.
    /// </summary>
    Task<IEnumerable<RankingsResult>> GetPublishedRankingsSnapshotsBySeasonRangeAsync(int minSeason, int maxSeason);

    /// <summary>
    /// Retrieves the published week numbers for the given season.
    /// </summary>
    Task<IEnumerable<int>> GetPublishedWeekNumbersAsync(int season);

    /// <summary>
    /// Computes rank deltas by comparing current rankings against the previous published rankings snapshot.
    /// Returns null for all teams when no previous published rankings snapshot exists for the season.
    /// </summary>
    Task<IDictionary<string, int?>> GetRankDeltasAsync(int season, int week, IEnumerable<RankedTeam> currentRankings);

    /// <summary>
    /// Retrieves a rankings snapshot for the given season and week regardless of published status.
    /// </summary>
    Task<RankingsResult?> GetRankingsSnapshotAsync(int season, int week);

    /// <summary>
    /// Retrieves all persisted week summaries including draft and published.
    /// </summary>
    Task<IEnumerable<RankingsSnapshotSummary>> GetRankingsSnapshotsAsync();

    /// <summary>
    /// Publishes a rankings snapshot for the given season and week.
    /// </summary>
    Task<bool> PublishRankingsSnapshotAsync(int season, int week);

    /// <summary>
    /// Saves a rankings result as a draft rankings snapshot, tagged with the algorithm version that produced it.
    /// </summary>
    Task<bool> SaveRankingsSnapshotAsync(RankingsResult rankings, RatingAlgorithmVersion algorithmVersion);
}
