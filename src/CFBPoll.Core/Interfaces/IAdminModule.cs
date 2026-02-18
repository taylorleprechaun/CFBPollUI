using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for admin operations including calculating and managing rankings snapshots.
/// </summary>
public interface IAdminModule
{
    /// <summary>
    /// Calculates rankings for the given season and week and saves as a draft.
    /// </summary>
    Task<CalculateRankingsResult> CalculateRankingsAsync(int season, int week);

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
    /// Gets all persisted week summaries.
    /// </summary>
    Task<IEnumerable<PersistedWeekSummary>> GetPersistedWeeksAsync();

    /// <summary>
    /// Publishes a snapshot for the given season and week.
    /// </summary>
    Task<bool> PublishSnapshotAsync(int season, int week);
}
