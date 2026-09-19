using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class GameOverrideModuleTests
{
    private readonly Mock<IGameOverrideData> _mockGameOverrideData;
    private readonly Mock<ILogger<GameOverrideModule>> _mockLogger;
    private readonly GameOverrideModule _module;

    public GameOverrideModuleTests()
    {
        _mockGameOverrideData = new Mock<IGameOverrideData>();
        _mockLogger = new Mock<ILogger<GameOverrideModule>>();

        _module = new GameOverrideModule(_mockGameOverrideData.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task ApplyOverridesAsync_GamesWithMatchingOverride_PreservesOfficialScoreAndOtherFields()
    {
        var awayStats = new AdvancedGameStats { GameID = 401123456, Team = "Oklahoma" };
        var games = new List<Game>
        {
            new()
            {
                AwayAdvancedStats = awayStats,
                AwayPoints = 21,
                AwayTeam = "Oklahoma",
                GameID = 401123456,
                HomePoints = 24,
                HomeTeam = "Notre Dame",
                NeutralSite = true,
                SeasonType = "regular",
                Week = 3
            }
        };
        var gameOverride = CreateGameOverride(gameID: 401123456, overrideHomePoints: 21, overrideAwayPoints: 24);
        _mockGameOverrideData
            .Setup(x => x.GetGameOverridesBySeasonAsync(2026))
            .ReturnsAsync([gameOverride]);

        var result = await _module.ApplyOverridesAsync(games, 2026);

        var overriddenGame = Assert.Single(result);
        Assert.Equal(24, overriddenGame.OriginalHomePoints);
        Assert.Equal(21, overriddenGame.OriginalAwayPoints);
        Assert.Same(awayStats, overriddenGame.AwayAdvancedStats);
        Assert.True(overriddenGame.NeutralSite);
        Assert.Equal("regular", overriddenGame.SeasonType);
        Assert.Equal(3, overriddenGame.Week);
    }

    [Fact]
    public async Task ApplyOverridesAsync_GamesWithMatchingOverride_ReturnsGameWithOverriddenScore()
    {
        var games = new List<Game>
        {
            new()
            {
                AwayPoints = 21,
                AwayTeam = "Oklahoma",
                GameID = 401123456,
                HomePoints = 24,
                HomeTeam = "Notre Dame",
                Week = 3
            }
        };
        var gameOverride = CreateGameOverride(gameID: 401123456, overrideHomePoints: 21, overrideAwayPoints: 24);
        _mockGameOverrideData
            .Setup(x => x.GetGameOverridesBySeasonAsync(2026))
            .ReturnsAsync([gameOverride]);

        var result = await _module.ApplyOverridesAsync(games, 2026);

        var overriddenGame = Assert.Single(result);
        Assert.Equal(21, overriddenGame.HomePoints);
        Assert.Equal(24, overriddenGame.AwayPoints);
        Assert.Equal(gameOverride.Reason, overriddenGame.ScoreOverrideReason);
    }

    [Fact]
    public async Task ApplyOverridesAsync_GamesWithNoMatchingOverride_ReturnsGameUnchanged()
    {
        var games = new List<Game>
        {
            new()
            {
                AwayPoints = 21,
                AwayTeam = "Oklahoma",
                GameID = 401123456,
                HomePoints = 24,
                HomeTeam = "Notre Dame",
                Week = 3
            }
        };
        var gameOverride = CreateGameOverride(gameID: 401999999);
        _mockGameOverrideData
            .Setup(x => x.GetGameOverridesBySeasonAsync(2026))
            .ReturnsAsync([gameOverride]);

        var result = await _module.ApplyOverridesAsync(games, 2026);

        var unchangedGame = Assert.Single(result);
        Assert.Equal(24, unchangedGame.HomePoints);
        Assert.Equal(21, unchangedGame.AwayPoints);
    }

    [Fact]
    public async Task ApplyOverridesAsync_GamesWithNoOverridesForSeason_ReturnsSameCollection()
    {
        var games = new List<Game>
        {
            new() { AwayPoints = 21, AwayTeam = "Oklahoma", GameID = 401123456, HomePoints = 24, HomeTeam = "Notre Dame", Week = 3 }
        };
        _mockGameOverrideData
            .Setup(x => x.GetGameOverridesBySeasonAsync(2026))
            .ReturnsAsync([]);

        var result = await _module.ApplyOverridesAsync(games, 2026);

        Assert.Same(games, result);
    }

    [Fact]
    public async Task ApplyOverridesAsync_NullGames_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _module.ApplyOverridesAsync((IEnumerable<Game>)null!, 2026));
    }

    [Fact]
    public async Task ApplyOverridesAsync_NullScheduleGames_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _module.ApplyOverridesAsync((IEnumerable<ScheduleGame>)null!, 2026));
    }

    [Fact]
    public async Task ApplyOverridesAsync_ScheduleGamesWithMatchingOverride_ReturnsGameWithOverriddenScore()
    {
        var games = new List<ScheduleGame>
        {
            new()
            {
                AwayPoints = 21,
                AwayTeam = "Oklahoma",
                Completed = true,
                GameID = 401123456,
                HomePoints = 24,
                HomeTeam = "Notre Dame",
                Week = 3
            }
        };
        var gameOverride = CreateGameOverride(gameID: 401123456, overrideHomePoints: 21, overrideAwayPoints: 24);
        _mockGameOverrideData
            .Setup(x => x.GetGameOverridesBySeasonAsync(2026))
            .ReturnsAsync([gameOverride]);

        var result = await _module.ApplyOverridesAsync(games, 2026);

        var overriddenGame = Assert.Single(result);
        Assert.Equal(21, overriddenGame.HomePoints);
        Assert.Equal(24, overriddenGame.AwayPoints);
        Assert.Equal(21, overriddenGame.OriginalAwayPoints);
        Assert.Equal(24, overriddenGame.OriginalHomePoints);
        Assert.True(overriddenGame.Completed);
        Assert.Equal(gameOverride.Reason, overriddenGame.ScoreOverrideReason);
    }

    [Fact]
    public async Task ApplyOverridesAsync_ScheduleGamesWithNoMatchingOverride_ReturnsGameUnchanged()
    {
        var games = new List<ScheduleGame>
        {
            new()
            {
                AwayPoints = 21,
                AwayTeam = "Oklahoma",
                Completed = true,
                GameID = 401123456,
                HomePoints = 24,
                HomeTeam = "Notre Dame",
                Week = 3
            }
        };
        var gameOverride = CreateGameOverride(gameID: 401999999);
        _mockGameOverrideData
            .Setup(x => x.GetGameOverridesBySeasonAsync(2026))
            .ReturnsAsync([gameOverride]);

        var result = await _module.ApplyOverridesAsync(games, 2026);

        var unchangedGame = Assert.Single(result);
        Assert.Equal(24, unchangedGame.HomePoints);
        Assert.Equal(21, unchangedGame.AwayPoints);
        Assert.Null(unchangedGame.OriginalAwayPoints);
        Assert.Null(unchangedGame.OriginalHomePoints);
    }

    [Fact]
    public void Constructor_NullGameOverrideData_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new GameOverrideModule(null!, new Mock<ILogger<GameOverrideModule>>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new GameOverrideModule(new Mock<IGameOverrideData>().Object, null!));
    }

    [Fact]
    public async Task DeleteGameOverrideAsync_DelegatesToData()
    {
        _mockGameOverrideData
            .Setup(x => x.DeleteGameOverrideAsync(401123456))
            .ReturnsAsync(true);

        var result = await _module.DeleteGameOverrideAsync(401123456);

        Assert.True(result);
        _mockGameOverrideData.Verify(x => x.DeleteGameOverrideAsync(401123456), Times.Once);
    }

    [Fact]
    public async Task GetGameOverrideAsync_DelegatesToData()
    {
        var gameOverride = CreateGameOverride(gameID: 401123456);
        _mockGameOverrideData
            .Setup(x => x.GetGameOverrideAsync(401123456))
            .ReturnsAsync(gameOverride);

        var result = await _module.GetGameOverrideAsync(401123456);

        Assert.Same(gameOverride, result);
    }

    [Fact]
    public async Task GetGameOverridesBySeasonAsync_DelegatesToData()
    {
        var overrides = new List<GameOverride> { CreateGameOverride(gameID: 401123456) };
        _mockGameOverrideData
            .Setup(x => x.GetGameOverridesBySeasonAsync(2026))
            .ReturnsAsync(overrides);

        var result = await _module.GetGameOverridesBySeasonAsync(2026);

        Assert.Same(overrides, result);
    }

    [Fact]
    public async Task SaveGameOverrideAsync_DelegatesToData()
    {
        var gameOverride = CreateGameOverride(gameID: 401123456);
        _mockGameOverrideData
            .Setup(x => x.SaveGameOverrideAsync(gameOverride))
            .ReturnsAsync(true);

        var result = await _module.SaveGameOverrideAsync(gameOverride);

        Assert.True(result);
        _mockGameOverrideData.Verify(x => x.SaveGameOverrideAsync(gameOverride), Times.Once);
    }

    private static GameOverride CreateGameOverride(
        long gameID,
        int overrideHomePoints = 21,
        int overrideAwayPoints = 24)
    {
        var now = DateTime.UtcNow;

        return new GameOverride
        {
            AwayTeam = "Oklahoma",
            CreatedAt = now,
            GameID = gameID,
            HomeTeam = "Notre Dame",
            ModifiedAt = now,
            OriginalAwayPoints = 24,
            OriginalHomePoints = 21,
            OverrideAwayPoints = overrideAwayPoints,
            OverrideHomePoints = overrideHomePoints,
            Reason = "Clock did not stop for an incomplete pass with 4 seconds remaining.",
            Season = 2026,
            SeasonType = "regular",
            Week = 3
        };
    }
}
