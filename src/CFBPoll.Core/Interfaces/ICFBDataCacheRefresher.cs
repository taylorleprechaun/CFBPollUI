using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Re-fetches cached College Football Data API responses and replaces the cached copies, so callers
/// never have to wait on the API for data that is kept warm in the background.
/// </summary>
public interface ICFBDataCacheRefresher
{
    /// <summary>
    /// Re-fetches and replaces the cached calendar for a year.
    /// </summary>
    /// <returns>True if the cached copy was replaced; false if an empty fetch left existing data in place.</returns>
    Task<bool> RefreshCalendarAsync(int year);

    /// <summary>
    /// Re-fetches and replaces the cached conference list.
    /// </summary>
    /// <returns>True if the cached copy was replaced; false if an empty fetch left existing data in place.</returns>
    Task<bool> RefreshConferencesAsync();

    /// <summary>
    /// Re-fetches and replaces the cached FBS team list for a season.
    /// </summary>
    /// <returns>True if the cached copy was replaced; false if an empty fetch left existing data in place.</returns>
    Task<bool> RefreshFBSTeamsAsync(int season);

    /// <summary>
    /// Re-fetches and replaces the cached full schedule for a season.
    /// </summary>
    /// <returns>True if the cached copy was replaced; false if an empty fetch left existing data in place.</returns>
    Task<bool> RefreshFullSeasonScheduleAsync(int season);

    /// <summary>
    /// Re-fetches and replaces the cached game results (schedule and games) for a season. Only entries
    /// already in the cache are refreshed; an entry whose fetch fails or comes back empty keeps its existing copy.
    /// </summary>
    /// <returns>How many entries were replaced and how many kept their existing copy.</returns>
    Task<CacheRefreshResult> RefreshGameResultsAsync(int season);

    /// <summary>
    /// Re-fetches and replaces the cached most recent season year.
    /// </summary>
    /// <returns>The refreshed season year.</returns>
    Task<int> RefreshMaxSeasonYearAsync();

    /// <summary>
    /// Re-fetches and replaces the cached entries scoped to a season and week. Only entries already in the
    /// cache are refreshed; an entry whose fetch fails or comes back empty keeps its existing copy.
    /// </summary>
    /// <returns>How many entries were replaced and how many kept their existing copy.</returns>
    Task<CacheRefreshResult> RefreshSeasonScopedAsync(int season, int week);
}
