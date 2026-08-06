using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for managing persisted game predictions data.
/// </summary>
public interface IPredictionsModule
{
    /// <summary>
    /// Determines whether graded results have been published for the given season and week.
    /// </summary>
    Task<bool> AreResultsPublishedAsync(int season, int week);

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
    /// Retrieves a published prediction result for the given season and week, along with whether
    /// its graded results have been published.
    /// </summary>
    Task<(PredictionsResult Predictions, bool ResultsPublished)?> GetPublishedAsync(int season, int week);

    /// <summary>
    /// Retrieves the distinct seasons that have at least one published prediction week, in
    /// descending order.
    /// </summary>
    Task<IEnumerable<int>> GetPublishedSeasonsAsync();

    /// <summary>
    /// Retrieves the published prediction week numbers for the given season.
    /// </summary>
    Task<IEnumerable<int>> GetPublishedWeekNumbersAsync(int season);

    /// <summary>
    /// Publishes predictions for the given season and week.
    /// </summary>
    Task<bool> PublishAsync(int season, int week);

    /// <summary>
    /// Publishes graded results for the given season and week. Only succeeds if the week has
    /// already been graded and the picks themselves are published.
    /// </summary>
    Task<bool> PublishGradedResultsAsync(int season, int week);

    /// <summary>
    /// Saves predictions as a draft.
    /// </summary>
    Task<bool> SaveAsync(PredictionsResult predictions);

    /// <summary>
    /// Saves graded results for the given season and week without changing publish state.
    /// </summary>
    Task<bool> SaveGradedResultAsync(PredictionsResult gradedPredictions);
}
