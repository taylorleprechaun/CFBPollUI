using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Data access for persisted rankings snapshots.
/// </summary>
public interface IRankingsData
{
    /// <summary>
    /// Deletes a snapshot for the given season and week.
    /// </summary>
    Task<bool> DeleteSnapshotAsync(int season, int week);

    /// <summary>
    /// Retrieves all persisted week summaries including draft and published.
    /// </summary>
    Task<IEnumerable<PersistedWeekSummary>> GetPersistedWeeksAsync();

    /// <summary>
    /// Retrieves the published week numbers for the given season.
    /// </summary>
    Task<IEnumerable<int>> GetPublishedWeekNumbersAsync(int season);

    /// <summary>
    /// Retrieves a published snapshot for the given season and week.
    /// </summary>
    Task<RankingsResult?> GetPublishedSnapshotAsync(int season, int week);

    /// <summary>
    /// Retrieves a snapshot for the given season and week regardless of published status.
    /// </summary>
    Task<RankingsResult?> GetSnapshotAsync(int season, int week);

    /// <summary>
    /// Creates the database table if it does not exist.
    /// </summary>
    Task InitializeAsync();

    /// <summary>
    /// Publishes a snapshot for the given season and week.
    /// </summary>
    Task<bool> PublishSnapshotAsync(int season, int week);

    /// <summary>
    /// Saves a rankings result as a draft snapshot.
    /// </summary>
    Task<bool> SaveSnapshotAsync(RankingsResult rankings);
}
