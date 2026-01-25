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
    /// Generates week labels from calendar weeks.
    /// </summary>
    /// <param name="calendarWeeks">The calendar weeks to label.</param>
    /// <returns>Collection of week info with labels.</returns>
    IEnumerable<WeekInfo> GetWeekLabels(IEnumerable<CalendarWeek> calendarWeeks);
}
