using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for admin operations including calculating and managing rankings snapshots and predictions.
/// </summary>
public interface IAdminModule
{
    /// <summary>
    /// Calculates predictions for the given season and week and saves as a draft.
    /// </summary>
    Task<CalculatePredictionsResult> CalculatePredictionsAsync(int season, int week);

    /// <summary>
    /// Calculates rankings for the given season and week and saves as a draft.
    /// </summary>
    Task<CalculateRankingsResult> CalculateRankingsAsync(int season, int week);

    /// <summary>
    /// Deletes predictions for the given season and week.
    /// </summary>
    Task<bool> DeletePredictionsAsync(int season, int week);

    /// <summary>
    /// Deletes a snapshot for the given season and week.
    /// </summary>
    Task<bool> DeleteSnapshotAsync(int season, int week);

    /// <summary>
    /// Generates an Excel export of rankings for the given season and week.
    /// </summary>
    /// <returns>Excel file bytes, or null if no snapshot exists.</returns>
    Task<byte[]?> ExportRankingsAsync(int season, int week);

    /// <summary>
    /// Gets all persisted prediction summaries.
    /// </summary>
    Task<IEnumerable<PredictionsSummary>> GetPredictionsSummariesAsync();

    /// <summary>
    /// Gets all persisted week summaries.
    /// </summary>
    Task<IEnumerable<SnapshotSummary>> GetSnapshotsAsync();

    /// <summary>
    /// Publishes predictions for the given season and week.
    /// </summary>
    Task<bool> PublishPredictionsAsync(int season, int week);

    /// <summary>
    /// Publishes a snapshot for the given season and week.
    /// </summary>
    Task<bool> PublishSnapshotAsync(int season, int week);

    /// <summary>
    /// Removes cached CollegeFootballData API responses scoped to the given season and week,
    /// forcing the next data fetch to pull fresh data. Does not recalculate rankings or predictions.
    /// </summary>
    /// <returns>The number of cache entries actually removed.</returns>
    Task<int> RefreshSeasonCacheAsync(int season, int week);
}
