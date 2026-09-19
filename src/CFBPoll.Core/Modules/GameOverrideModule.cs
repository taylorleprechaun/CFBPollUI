using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Modules;

public class GameOverrideModule : IGameOverrideModule
{
    private readonly IGameOverrideData _gameOverrideData;
    private readonly ILogger<GameOverrideModule> _logger;

    public GameOverrideModule(IGameOverrideData gameOverrideData, ILogger<GameOverrideModule> logger)
    {
        _gameOverrideData = gameOverrideData ?? throw new ArgumentNullException(nameof(gameOverrideData));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IEnumerable<Game>> ApplyOverridesAsync(IEnumerable<Game> games, int season)
    {
        ArgumentNullException.ThrowIfNull(games);

        var overridesByGameID = await BuildOverrideLookupAsync(season).ConfigureAwait(false);
        if (overridesByGameID.Count == 0)
            return games;

        return games.Select(game => ApplyOverride(game, overridesByGameID)).ToList();
    }

    public async Task<IEnumerable<ScheduleGame>> ApplyOverridesAsync(IEnumerable<ScheduleGame> games, int season)
    {
        ArgumentNullException.ThrowIfNull(games);

        var overridesByGameID = await BuildOverrideLookupAsync(season).ConfigureAwait(false);
        if (overridesByGameID.Count == 0)
            return games;

        return games.Select(game => ApplyOverride(game, overridesByGameID)).ToList();
    }

    public async Task<bool> DeleteGameOverrideAsync(long gameID)
    {
        return await _gameOverrideData.DeleteGameOverrideAsync(gameID).ConfigureAwait(false);
    }

    public async Task<GameOverride?> GetGameOverrideAsync(long gameID)
    {
        return await _gameOverrideData.GetGameOverrideAsync(gameID).ConfigureAwait(false);
    }

    public async Task<IEnumerable<GameOverride>> GetGameOverridesBySeasonAsync(int season)
    {
        return await _gameOverrideData.GetGameOverridesBySeasonAsync(season).ConfigureAwait(false);
    }

    public async Task<bool> SaveGameOverrideAsync(GameOverride gameOverride)
    {
        return await _gameOverrideData.SaveGameOverrideAsync(gameOverride).ConfigureAwait(false);
    }

    private static Game ApplyOverride(Game game, IReadOnlyDictionary<long, GameOverride> overridesByGameID)
    {
        if (!game.GameID.HasValue || !overridesByGameID.TryGetValue(game.GameID.Value, out var gameOverride))
            return game;

        var overridden = game.Clone();
        overridden.AwayPoints = gameOverride.OverrideAwayPoints;
        overridden.HomePoints = gameOverride.OverrideHomePoints;
        overridden.OriginalAwayPoints = game.AwayPoints;
        overridden.OriginalHomePoints = game.HomePoints;
        overridden.ScoreOverrideReason = gameOverride.Reason;

        return overridden;
    }

    private static ScheduleGame ApplyOverride(ScheduleGame game, IReadOnlyDictionary<long, GameOverride> overridesByGameID)
    {
        if (!game.GameID.HasValue || !overridesByGameID.TryGetValue(game.GameID.Value, out var gameOverride))
            return game;

        var overridden = game.Clone();
        overridden.AwayPoints = gameOverride.OverrideAwayPoints;
        overridden.HomePoints = gameOverride.OverrideHomePoints;
        overridden.OriginalAwayPoints = game.AwayPoints;
        overridden.OriginalHomePoints = game.HomePoints;
        overridden.ScoreOverrideReason = gameOverride.Reason;

        return overridden;
    }

    private async Task<IReadOnlyDictionary<long, GameOverride>> BuildOverrideLookupAsync(int season)
    {
        var overrides = (await _gameOverrideData.GetGameOverridesBySeasonAsync(season).ConfigureAwait(false)).ToList();

        if (overrides.Count > 0)
        {
            _logger.LogDebug("Applying {Count} game score override(s) for season {Season}", overrides.Count, season);
        }

        return overrides.ToDictionary(o => o.GameID, o => o);
    }
}
