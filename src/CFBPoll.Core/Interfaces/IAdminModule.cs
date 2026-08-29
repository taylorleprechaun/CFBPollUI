using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for admin operations including calculating and managing rankings snapshots and predictions.
/// </summary>
public interface IAdminModule
{
    /// <summary>
    /// Calculates rankings for the given season and week using an explicitly chosen algorithm
    /// version, without persisting or publishing anything. Intended for previewing how a candidate
    /// algorithm would score a historical or current week before it becomes the season default.
    /// </summary>
    Task<ExperimentalCalculateResult> CalculateExperimentalAsync(int season, int week, RatingAlgorithmVersion algorithmVersion);

    /// <summary>
    /// Calculates predictions for the given season and week using an explicitly chosen algorithm
    /// version and grades them against actual results, without persisting anything.
    /// </summary>
    Task<ExperimentalPredictionsResult> CalculateExperimentalPredictionsAsync(int season, int week, RatingAlgorithmVersion algorithmVersion);

    /// <summary>
    /// Calculates predictions for an explicit subset of weeks within a season using an explicitly
    /// chosen algorithm version, grades each week against actual results where available, and
    /// aggregates a season-overall summary alongside a per-week breakdown, without persisting anything.
    /// </summary>
    Task<SeasonExperimentalPredictionsResult> CalculateExperimentalSeasonPredictionsAsync(int season, IEnumerable<int> weeks, RatingAlgorithmVersion algorithmVersion);

    /// <summary>
    /// Computes season trends (top-25 rank progression with drop-out gaps) live across every week of
    /// a season using an explicitly chosen algorithm version, without reading or requiring persisted
    /// published snapshots.
    /// </summary>
    Task<SeasonTrendsResult> CalculateExperimentalSeasonTrendsAsync(int season, RatingAlgorithmVersion algorithmVersion);

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
    /// Generates an Excel export of rankings for the given season and week using an explicitly
    /// chosen algorithm version, without persisting or publishing anything.
    /// </summary>
    Task<byte[]> ExportExperimentalAsync(int season, int week, RatingAlgorithmVersion algorithmVersion);

    /// <summary>
    /// Generates an Excel export of rankings for the given season and week.
    /// </summary>
    /// <returns>Excel file bytes, or null if no snapshot exists.</returns>
    Task<byte[]?> ExportRankingsAsync(int season, int week);

    /// <summary>
    /// Retrieves every persistent cache entry, grouped into a display-friendly family/season/detail
    /// summary for the admin cache management page.
    /// </summary>
    Task<IEnumerable<CacheEntrySummary>> GetCacheEntriesAsync();

    /// <summary>
    /// Retrieves the site's CollegeFootballData.com API account status: quota, tier, and recent usage.
    /// </summary>
    /// <param name="forceRefresh">Whether to bypass any cached value and fetch live data.</param>
    /// <returns>The current CFBD API usage snapshot.</returns>
    Task<CFBDUsage> GetCFBDUsageAsync(bool forceRefresh = false);

    /// <summary>
    /// Retrieves the persisted predictions for the given season and week without recalculating or
    /// re-grading, along with publish/grade status flags. Returns null if no predictions exist for
    /// the week.
    /// </summary>
    Task<GetPredictionsResult?> GetPredictionsAsync(int season, int week);

    /// <summary>
    /// Gets all persisted prediction summaries.
    /// </summary>
    Task<IEnumerable<PredictionsSummary>> GetPredictionsSummariesAsync();

    /// <summary>
    /// Gets all persisted week summaries.
    /// </summary>
    Task<IEnumerable<RankingsSnapshotSummary>> GetSnapshotsAsync();

    /// <summary>
    /// Grades predictions for the given season and week against actual final scores and saves the
    /// result as a draft. Returns null if no predictions have been generated for the week.
    /// </summary>
    Task<GradePredictionsResult?> GradePredictionsAsync(int season, int week);

    /// <summary>
    /// Publishes graded results for the given season and week, making them visible on the public
    /// predictions page. Only succeeds if the week has already been graded and the picks are published.
    /// </summary>
    Task<bool> PublishGradedResultsAsync(int season, int week);

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

    /// <summary>
    /// Removes the persistent cache entries matching the given keys.
    /// </summary>
    /// <returns>The number of cache entries actually removed.</returns>
    Task<int> RemoveCacheEntriesAsync(IEnumerable<string> keys);

    /// <summary>
    /// Removes a single persistent cache entry by key.
    /// </summary>
    /// <returns>True if an entry was removed; otherwise false.</returns>
    Task<bool> RemoveCacheEntryAsync(string key);
}
