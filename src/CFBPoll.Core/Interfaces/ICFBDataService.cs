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

    /// <summary>
    /// Retrieves advanced game statistics for all teams in a given season.
    /// </summary>
    /// <param name="season">The season year.</param>
    /// <param name="seasonType">Season type: "regular", "postseason", or "both".</param>
    /// <returns>Collection of advanced game statistics.</returns>
    Task<IEnumerable<AdvancedGameStats>> GetAdvancedGameStatsAsync(int season, string seasonType);

    /// <summary>
    /// Retrieves all FBS teams for a given season with metadata only (no games or stats).
    /// </summary>
    /// <param name="season">The season year.</param>
    /// <returns>Collection of FBS team metadata.</returns>
    Task<IEnumerable<FBSTeam>> GetFBSTeamsAsync(int season);

    /// <summary>
    /// Retrieves the full season schedule including all regular and postseason games
    /// regardless of completion status.
    /// </summary>
    /// <param name="season">The season year to retrieve the schedule for.</param>
    /// <returns>Collection of all scheduled games for the season.</returns>
    Task<IEnumerable<ScheduleGame>> GetFullSeasonScheduleAsync(int season);

    /// <summary>
    /// Retrieves completed games for a given season and season type mapped to domain Game objects.
    /// </summary>
    /// <param name="season">The season year.</param>
    /// <param name="seasonType">Season type: "regular" or "postseason".</param>
    /// <returns>Collection of completed games.</returns>
    Task<IEnumerable<Game>> GetGamesAsync(int season, string seasonType);

    /// <summary>
    /// Retrieves aggregated team statistics for a season, optionally limited to a specific end week.
    /// </summary>
    /// <param name="season">The season year.</param>
    /// <param name="endWeek">Optional end week to limit stats. Null returns full season stats.</param>
    /// <returns>Dictionary of team name to their statistics.</returns>
    Task<IDictionary<string, IEnumerable<TeamStat>>> GetSeasonTeamStatsAsync(int season, int? endWeek);
}
