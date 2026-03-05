using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for generating complete rankings from team ratings and managing persisted rankings data.
/// </summary>
public interface IRankingsModule
{
    /// <summary>
    /// Deletes a snapshot for the given season and week.
    /// </summary>
    Task<bool> DeleteSnapshotAsync(int season, int week);

    /// <summary>
    /// Generates complete rankings from season data and calculated ratings.
    /// </summary>
    /// <param name="seasonData">The season data containing teams and game results.</param>
    /// <param name="ratings">Dictionary mapping team names to their calculated rating details.</param>
    /// <returns>Rankings result containing all ranked teams.</returns>
    Task<RankingsResult> GenerateRankingsAsync(SeasonData seasonData, IDictionary<string, RatingDetails> ratings);

    /// <summary>
    /// Retrieves all persisted week summaries including draft and published.
    /// </summary>
    Task<IEnumerable<SnapshotSummary>> GetSnapshotsAsync();

    /// <summary>
    /// Retrieves the published week numbers for the given season.
    /// </summary>
    Task<IEnumerable<int>> GetPublishedWeekNumbersAsync(int season);

    /// <summary>
    /// Computes rank deltas by comparing current rankings against the previous published snapshot.
    /// Returns null for all teams when no previous published snapshot exists for the season.
    /// </summary>
    Task<IDictionary<string, int?>> GetRankDeltasAsync(int season, int week, IEnumerable<RankedTeam> currentRankings);

    /// <summary>
    /// Retrieves a published snapshot for the given season and week.
    /// </summary>
    Task<RankingsResult?> GetPublishedSnapshotAsync(int season, int week);

    /// <summary>
    /// Retrieves all published snapshots within the given season range.
    /// </summary>
    Task<IEnumerable<RankingsResult>> GetPublishedSnapshotsBySeasonRangeAsync(int minSeason, int maxSeason);

    /// <summary>
    /// Retrieves a snapshot for the given season and week regardless of published status.
    /// </summary>
    Task<RankingsResult?> GetSnapshotAsync(int season, int week);

    /// <summary>
    /// Publishes a snapshot for the given season and week.
    /// </summary>
    Task<bool> PublishSnapshotAsync(int season, int week);

    /// <summary>
    /// Saves a rankings result as a draft snapshot.
    /// </summary>
    Task<bool> SaveSnapshotAsync(RankingsResult rankings);
}
