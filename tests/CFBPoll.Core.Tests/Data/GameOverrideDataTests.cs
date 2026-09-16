using CFBPoll.Core.Data;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Data;

public class GameOverrideDataTests
{
    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        var options = new Mock<IOptions<DatabaseOptions>>();
        options.Setup(x => x.Value).Returns(new DatabaseOptions());

        Assert.Throws<ArgumentNullException>(() =>
            new GameOverrideData(options.Object, null!));
    }

    [Fact]
    public void Constructor_NullOptions_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new GameOverrideData(null!, new Mock<ILogger<GameOverrideData>>().Object));
    }

    [Fact]
    public async Task DeleteGameOverrideAsync_ExistingOverride_RemovesRecordAndReturnsTrue()
    {
        var (data, tempPath) = CreateGameOverrideDataWithFile();
        try
        {
            await data.InitializeAsync();
            await data.SaveGameOverrideAsync(CreateGameOverride(gameID: 401123456));

            var deleted = await data.DeleteGameOverrideAsync(401123456);
            var afterDelete = await data.GetGameOverrideAsync(401123456);

            Assert.True(deleted);
            Assert.Null(afterDelete);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task DeleteGameOverrideAsync_NonexistentOverride_ReturnsFalse()
    {
        var (data, tempPath) = CreateGameOverrideDataWithFile();
        try
        {
            await data.InitializeAsync();

            var deleted = await data.DeleteGameOverrideAsync(999999999);

            Assert.False(deleted);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetGameOverrideAsync_NoOverrideExists_ReturnsNull()
    {
        var (data, tempPath) = CreateGameOverrideDataWithFile();
        try
        {
            await data.InitializeAsync();

            var result = await data.GetGameOverrideAsync(401123456);

            Assert.Null(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetGameOverrideAsync_OverrideExists_ReturnsMatchingRecord()
    {
        var (data, tempPath) = CreateGameOverrideDataWithFile();
        try
        {
            await data.InitializeAsync();
            var gameOverride = CreateGameOverride(gameID: 401123456);
            await data.SaveGameOverrideAsync(gameOverride);

            var result = await data.GetGameOverrideAsync(401123456);

            Assert.NotNull(result);
            Assert.Equal(gameOverride.GameID, result!.GameID);
            Assert.Equal(gameOverride.Season, result.Season);
            Assert.Equal(gameOverride.Week, result.Week);
            Assert.Equal(gameOverride.SeasonType, result.SeasonType);
            Assert.Equal(gameOverride.HomeTeam, result.HomeTeam);
            Assert.Equal(gameOverride.AwayTeam, result.AwayTeam);
            Assert.Equal(gameOverride.OriginalHomePoints, result.OriginalHomePoints);
            Assert.Equal(gameOverride.OriginalAwayPoints, result.OriginalAwayPoints);
            Assert.Equal(gameOverride.OverrideHomePoints, result.OverrideHomePoints);
            Assert.Equal(gameOverride.OverrideAwayPoints, result.OverrideAwayPoints);
            Assert.Equal(gameOverride.Reason, result.Reason);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetGameOverridesBySeasonAsync_NoOverridesForSeason_ReturnsEmpty()
    {
        var (data, tempPath) = CreateGameOverrideDataWithFile();
        try
        {
            await data.InitializeAsync();

            var result = await data.GetGameOverridesBySeasonAsync(2026);

            Assert.Empty(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetGameOverridesBySeasonAsync_OverridesExistForOtherSeason_ExcludesThem()
    {
        var (data, tempPath) = CreateGameOverrideDataWithFile();
        try
        {
            await data.InitializeAsync();
            await data.SaveGameOverrideAsync(CreateGameOverride(gameID: 401123456, season: 2025));
            await data.SaveGameOverrideAsync(CreateGameOverride(gameID: 401123457, season: 2026));

            var result = await data.GetGameOverridesBySeasonAsync(2026);

            var singleResult = Assert.Single(result);
            Assert.Equal(401123457, singleResult.GameID);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task InitializeAsync_CalledTwice_DoesNotThrow()
    {
        var (data, tempPath) = CreateGameOverrideDataWithFile();
        try
        {
            await data.InitializeAsync();
            await data.InitializeAsync();

            var result = await data.GetGameOverridesBySeasonAsync(2026);

            Assert.Empty(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task InitializeAsync_CreatesTable()
    {
        var (data, tempPath) = CreateGameOverrideDataWithFile();
        try
        {
            await data.InitializeAsync();

            await using var connection = new SqliteConnection($"Data Source={tempPath};Pooling=false");
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='GameOverride'";
            var result = await command.ExecuteScalarAsync();

            Assert.Equal("GameOverride", result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveGameOverrideAsync_ExistingGameID_ReplacesRecord()
    {
        var (data, tempPath) = CreateGameOverrideDataWithFile();
        try
        {
            await data.InitializeAsync();
            await data.SaveGameOverrideAsync(CreateGameOverride(gameID: 401123456, overrideHomePoints: 30, overrideAwayPoints: 27));

            var updated = CreateGameOverride(gameID: 401123456, overrideHomePoints: 27, overrideAwayPoints: 30, reason: "Corrected replay ruling");
            await data.SaveGameOverrideAsync(updated);

            var result = await data.GetGameOverrideAsync(401123456);

            Assert.NotNull(result);
            Assert.Equal(27, result!.OverrideHomePoints);
            Assert.Equal(30, result.OverrideAwayPoints);
            Assert.Equal("Corrected replay ruling", result.Reason);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveGameOverrideAsync_NewOverride_PersistsRecord()
    {
        var (data, tempPath) = CreateGameOverrideDataWithFile();
        try
        {
            await data.InitializeAsync();

            var saved = await data.SaveGameOverrideAsync(CreateGameOverride(gameID: 401123456));

            Assert.True(saved);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveGameOverrideAsync_NullGameOverride_ThrowsArgumentNullException()
    {
        var (data, tempPath) = CreateGameOverrideDataWithFile();
        try
        {
            await data.InitializeAsync();

            await Assert.ThrowsAsync<ArgumentNullException>(() => data.SaveGameOverrideAsync(null!));
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    private static void CleanupFile(string filePath)
    {
        SqliteConnection.ClearAllPools();
        try
        {
            if (File.Exists(filePath))
                File.Delete(filePath);
        }
        catch
        {
            // Best-effort cleanup
        }
    }

    private static GameOverride CreateGameOverride(
        long gameID,
        int season = 2026,
        int week = 3,
        int overrideHomePoints = 27,
        int overrideAwayPoints = 30,
        string reason = "Replay procedures were not properly followed.")
    {
        var now = DateTime.UtcNow;

        return new GameOverride
        {
            AwayTeam = "Iowa",
            CreatedAt = now,
            GameID = gameID,
            HomeTeam = "Nebraska",
            ModifiedAt = now,
            OriginalAwayPoints = 27,
            OriginalHomePoints = 30,
            OverrideAwayPoints = overrideAwayPoints,
            OverrideHomePoints = overrideHomePoints,
            Reason = reason,
            Season = season,
            SeasonType = "regular",
            Week = week
        };
    }

    private static (GameOverrideData data, string filePath) CreateGameOverrideDataWithFile()
    {
        var tempPath = Path.Combine(Path.GetTempPath(), $"cfbpoll_test_{Guid.NewGuid()}.db");

        var options = new Mock<IOptions<DatabaseOptions>>();
        options.Setup(x => x.Value).Returns(new DatabaseOptions
        {
            ConnectionString = $"Data Source={tempPath};Pooling=false"
        });

        var logger = new Mock<ILogger<GameOverrideData>>();
        return (new GameOverrideData(options.Object, logger.Object), tempPath);
    }
}
