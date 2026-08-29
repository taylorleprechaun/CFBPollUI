using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Data access for persisted rankings snapshots.
/// </summary>
public interface IRankingsData
{
    /// <summary>
    /// Deletes a rankings snapshot for the given season and week.
    /// </summary>
    Task<bool> DeleteRankingsSnapshotAsync(int season, int week);

    /// <summary>
    /// Retrieves the most recent published rankings snapshot before the given week in the same season.
    /// </summary>
    Task<RankingsResult?> GetPreviousPublishedRankingsSnapshotAsync(int season, int week);

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
    /// Retrieves a rankings snapshot for the given season and week regardless of published status.
    /// </summary>
    Task<RankingsResult?> GetRankingsSnapshotAsync(int season, int week);

    /// <summary>
    /// Retrieves all persisted week summaries including draft and published.
    /// </summary>
    Task<IEnumerable<RankingsSnapshotSummary>> GetRankingsSnapshotsAsync();

    /// <summary>
    /// Creates the database table if it does not exist.
    /// </summary>
    Task InitializeAsync();

    /// <summary>
    /// Publishes a rankings snapshot for the given season and week.
    /// </summary>
    Task<bool> PublishRankingsSnapshotAsync(int season, int week);

    /// <summary>
    /// Saves a rankings result as a draft rankings snapshot, tagged with the algorithm version that produced it.
    /// </summary>
    Task<bool> SaveRankingsSnapshotAsync(RankingsResult rankings, RatingAlgorithmVersion algorithmVersion);
}
