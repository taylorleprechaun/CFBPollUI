using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for managing persisted game predictions data.
/// </summary>
public interface IPredictionsModule
{
    /// <summary>
    /// Deletes predictions for the given season and week.
    /// </summary>
    Task<bool> DeleteAsync(int season, int week);

    /// <summary>
    /// Retrieves predictions for the given season and week.
    /// </summary>
    Task<PredictionsResult?> GetAsync(int season, int week);

    /// <summary>
    /// Retrieves all persisted prediction summaries including draft and published.
    /// </summary>
    Task<IEnumerable<PredictionsSummary>> GetAllSummariesAsync();

    /// <summary>
    /// Publishes predictions for the given season and week.
    /// </summary>
    Task<bool> PublishAsync(int season, int week);

    /// <summary>
    /// Saves predictions as a draft.
    /// </summary>
    Task<bool> SaveAsync(PredictionsResult predictions);
}
