using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

public class SeasonModule : ISeasonModule
{
    private readonly StringComparison _scoic = StringComparison.OrdinalIgnoreCase;

    public IEnumerable<int> GetSeasonRange(int minYear, int maxYear)
    {
        return Enumerable.Range(minYear, maxYear - minYear + 1).Reverse();
    }

    public IEnumerable<WeekInfo> GetWeekLabels(IEnumerable<CalendarWeek> calendarWeeks)
    {
        return calendarWeeks.Select(w => new WeekInfo
        {
            WeekNumber = w.Week,
            Label = w.SeasonType.Equals("postseason", _scoic)
                ? "Postseason"
                : $"Week {w.Week}"
        });
    }
}
