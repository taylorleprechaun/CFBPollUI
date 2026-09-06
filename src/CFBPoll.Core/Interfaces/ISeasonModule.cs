using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for season range and week label logic.
/// </summary>
public interface ISeasonModule
{
    /// <summary>
    /// Generates a range of season years from minimum to maximum, in descending order.
    /// </summary>
    /// <param name="minYear">The minimum year to include.</param>
    /// <param name="maxYear">The maximum year to include.</param>
    /// <returns>Collection of years in descending order.</returns>
    IEnumerable<int> GetSeasonRange(int minYear, int maxYear);

    /// <summary>
    /// Generates week labels from calendar weeks, including whether each week's games have all been played.
    /// </summary>
    /// <param name="calendarWeeks">The calendar weeks to label.</param>
    /// <param name="scheduleGames">The full season schedule, used to determine per-week completeness.</param>
    /// <returns>Collection of week info with labels and completeness.</returns>
    IEnumerable<WeekInfo> GetWeekLabels(IEnumerable<CalendarWeek> calendarWeeks, IEnumerable<ScheduleGame> scheduleGames);

    /// <summary>
    /// Determines whether every game in a given week has been played.
    /// </summary>
    /// <param name="weekNumber">The week number to check.</param>
    /// <param name="seasonType">The season type ("regular" or "postseason") the week belongs to.</param>
    /// <param name="scheduleGames">The full season schedule to check games against.</param>
    /// <returns><c>true</c> if at least one game matches the week and all matching games are completed; otherwise <c>false</c>.</returns>
    bool IsWeekComplete(int weekNumber, string seasonType, IEnumerable<ScheduleGame> scheduleGames);
}
