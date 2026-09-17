using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Applies manual game score overrides on top of fetched game data, and provides CRUD access to overrides.
/// </summary>
public interface IGameOverrideModule
{
    /// <summary>
    /// Returns a copy of <paramref name="games"/> with any manually overridden scores applied.
    /// Games without a matching override are returned unchanged.
    /// </summary>
    Task<IEnumerable<Game>> ApplyOverridesAsync(IEnumerable<Game> games, int season);

    /// <summary>
    /// Returns a copy of <paramref name="games"/> with any manually overridden scores applied.
    /// Games without a matching override are returned unchanged.
    /// </summary>
    Task<IEnumerable<ScheduleGame>> ApplyOverridesAsync(IEnumerable<ScheduleGame> games, int season);

    /// <summary>
    /// Deletes the override for the specified game, if one exists.
    /// </summary>
    Task<bool> DeleteGameOverrideAsync(long gameID);

    /// <summary>
    /// Retrieves the override for the specified game, if one exists.
    /// </summary>
    Task<GameOverride?> GetGameOverrideAsync(long gameID);

    /// <summary>
    /// Retrieves every override recorded for the specified season.
    /// </summary>
    Task<IEnumerable<GameOverride>> GetGameOverridesBySeasonAsync(int season);

    /// <summary>
    /// Creates or replaces the override for the game identified by <see cref="GameOverride.GameID"/>.
    /// </summary>
    Task<bool> SaveGameOverrideAsync(GameOverride gameOverride);
}
