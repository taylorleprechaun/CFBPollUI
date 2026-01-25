using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Service for retrieving college football data from the CollegeFootballData API.
/// </summary>
public interface ICFBDataService
{
    /// <summary>
    /// Retrieves season data including all FBS teams and games up to the specified week.
    /// </summary>
    /// <param name="season">The season year to retrieve data for.</param>
    /// <param name="week">The week number up to which games should be included.</param>
    /// <returns>A SeasonData object containing teams and games information.</returns>
    Task<SeasonData> GetSeasonDataAsync(int season, int week);

    /// <summary>
    /// Retrieves calendar information for the specified year.
    /// </summary>
    /// <param name="year">The year to get calendar data for.</param>
    /// <returns>Collection of calendar weeks including postseason.</returns>
    Task<IEnumerable<CalendarWeek>> GetCalendarAsync(int year);

    /// <summary>
    /// Determines the maximum available season year by checking calendar data.
    /// Starts from current year and decrements until valid data is found or 2000 is reached.
    /// </summary>
    /// <returns>The maximum season year with available data.</returns>
    Task<int> GetMaxSeasonYearAsync();

    /// <summary>
    /// Retrieves all FBS conferences.
    /// </summary>
    /// <returns>Collection of FBS conferences.</returns>
    Task<IEnumerable<Conference>> GetConferencesAsync();
}
