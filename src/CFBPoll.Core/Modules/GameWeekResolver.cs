using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

/// <summary>
/// Resolves the CFBD-facing game week and postseason status for a given internal week number.
/// </summary>
public static class GameWeekResolver
{
    /// <summary>
    /// The last regular-season game week in the schedule, or 0 when it has none.
    /// </summary>
    public static int GetMaxRegularWeek(IEnumerable<ScheduleGame> fullSchedule)
    {
        ArgumentNullException.ThrowIfNull(fullSchedule);

        var scoic = StringComparison.OrdinalIgnoreCase;

        return fullSchedule
            .Where(g => g.SeasonType is not null && g.SeasonType.Equals("regular", scoic) && g.Week.HasValue)
            .Select(g => g.Week!.Value)
            .DefaultIfEmpty(0)
            .Max();
    }

    public static (int GameWeek, bool IsPostseason) Resolve(int week, IEnumerable<ScheduleGame> fullSchedule)
    {
        ArgumentNullException.ThrowIfNull(fullSchedule);

        var gameWeek = week + 1;
        var isPostseason = gameWeek > GetMaxRegularWeek(fullSchedule);

        return (gameWeek, isPostseason);
    }
}
