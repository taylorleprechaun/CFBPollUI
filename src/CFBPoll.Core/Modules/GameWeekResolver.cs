using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

/// <summary>
/// Resolves the CFBD-facing game week and postseason status for a given internal week number.
/// </summary>
public static class GameWeekResolver
{
    public static (int GameWeek, bool IsPostseason) Resolve(int week, IEnumerable<ScheduleGame> fullSchedule)
    {
        ArgumentNullException.ThrowIfNull(fullSchedule);

        var scoic = StringComparison.OrdinalIgnoreCase;
        var gameWeek = week + 1;

        var maxRegularWeek = fullSchedule
            .Where(g => g.SeasonType is not null && g.SeasonType.Equals("regular", scoic) && g.Week.HasValue)
            .Select(g => g.Week!.Value)
            .DefaultIfEmpty(0)
            .Max();

        var isPostseason = gameWeek > maxRegularWeek;

        return (gameWeek, isPostseason);
    }
}
