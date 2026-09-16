using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Provides persistence for manual game score overrides.
/// </summary>
public interface IGameOverrideData
{
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
    /// Initializes the game override persistence store.
    /// </summary>
    Task InitializeAsync();

    /// <summary>
    /// Creates or replaces the override for the game identified by <see cref="GameOverride.GameID"/>.
    /// </summary>
    Task<bool> SaveGameOverrideAsync(GameOverride gameOverride);
}
