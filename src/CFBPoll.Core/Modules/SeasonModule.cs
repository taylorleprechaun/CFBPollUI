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

    public IEnumerable<WeekInfo> GetWeekLabels(IEnumerable<CalendarWeek> calendarWeeks, IEnumerable<ScheduleGame> scheduleGames)
    {
        var games = scheduleGames.ToList();

        return calendarWeeks.Select(w => new WeekInfo
        {
            IsComplete = IsWeekComplete(w.Week, w.SeasonType, games),
            WeekNumber = w.Week,
            // Week numbers represent when games are played; rankings reflect results after that week, so labels shift by +1
            Label = w.SeasonType.Equals("postseason", _scoic)
                ? "Postseason"
                : $"Week {w.Week + 1}"
        });
    }

    public bool IsWeekComplete(int weekNumber, string seasonType, IEnumerable<ScheduleGame> scheduleGames)
    {
        var isPostseason = seasonType.Equals("postseason", _scoic);

        var weekGames = scheduleGames.Where(g => isPostseason
            ? g.SeasonType is not null && g.SeasonType.Equals("postseason", _scoic)
            : g.SeasonType is not null && g.SeasonType.Equals("regular", _scoic) && g.Week == weekNumber);

        return weekGames.Any() && weekGames.All(g => g.Completed);
    }
}
