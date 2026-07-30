using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Data access for persisted game predictions.
/// </summary>
public interface IPredictionsData
{
    /// <summary>
    /// Deletes predictions for the given season and week.
    /// </summary>
    Task<bool> DeleteAsync(int season, int week);

    /// <summary>
    /// Retrieves all persisted prediction summaries including draft and published.
    /// </summary>
    Task<IEnumerable<PredictionsSummary>> GetAllSummariesAsync();

    /// <summary>
    /// Retrieves predictions for the given season and week.
    /// </summary>
    Task<PredictionsResult?> GetAsync(int season, int week);

    /// <summary>
    /// Retrieves a published prediction result for the given season and week.
    /// </summary>
    Task<PredictionsResult?> GetPublishedAsync(int season, int week);

    /// <summary>
    /// Retrieves the published prediction week numbers for the given season.
    /// </summary>
    Task<IEnumerable<int>> GetPublishedWeekNumbersAsync(int season);

    /// <summary>
    /// Creates the database table if it does not exist.
    /// </summary>
    Task InitializeAsync();

    /// <summary>
    /// Publishes predictions for the given season and week.
    /// </summary>
    Task<bool> PublishAsync(int season, int week);

    /// <summary>
    /// Saves predictions as a draft.
    /// </summary>
    Task<bool> SaveAsync(PredictionsResult predictions);
}
