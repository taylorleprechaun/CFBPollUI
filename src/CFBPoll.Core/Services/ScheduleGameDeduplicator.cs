using CFBPoll.Core.Models;

namespace CFBPoll.Core.Services;

/// <summary>
/// Collapses duplicate listings of the same fixture in a season schedule to the one game the rest of the
/// system treats as real. Mirrors the choice made for completed games, so a game picked from the schedule
/// (for example to override its score) is always the game that ratings are calculated from.
/// </summary>
internal static class ScheduleGameDeduplicator
{
    /// <summary>
    /// Keeps one game per home team, away team, week, and season type, preferring a game with both scores
    /// and then the highest game ID. Games without both team names (unscheduled placeholders) are always
    /// kept, since they would otherwise all collapse into one. Preserves the original ordering.
    /// </summary>
    public static IEnumerable<ScheduleGame> Deduplicate(IEnumerable<ScheduleGame> games)
    {
        ArgumentNullException.ThrowIfNull(games);

        var gameList = games.ToList();

        var keptGames = gameList
            .Where(g => g.HomeTeam is not null && g.AwayTeam is not null)
            .GroupBy(g => (
                HomeTeam: g.HomeTeam!.ToUpperInvariant(),
                AwayTeam: g.AwayTeam!.ToUpperInvariant(),
                g.Week,
                SeasonType: g.SeasonType?.ToUpperInvariant()))
            .Select(group => group
                .OrderByDescending(g => g.HomePoints.HasValue && g.AwayPoints.HasValue)
                .ThenByDescending(g => g.GameID)
                .First())
            .ToHashSet();

        return gameList
            .Where(g => g.HomeTeam is null || g.AwayTeam is null || keptGames.Contains(g))
            .ToList();
    }
}
