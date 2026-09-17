using System.Globalization;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Data;

public class GameOverrideData : IGameOverrideData
{
    private readonly string _connectionString;
    private readonly ILogger<GameOverrideData> _logger;

    public GameOverrideData(IOptions<DatabaseOptions> options, ILogger<GameOverrideData> logger)
    {
        _connectionString = options?.Value?.ConnectionString
            ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<bool> DeleteGameOverrideAsync(long gameID)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM GameOverride WHERE GameID = @GameID";
        command.Parameters.AddWithValue("@GameID", gameID);

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Deleted game override for game {GameID}: {RowsAffected} rows affected", gameID, rowsAffected);

        return rowsAffected > 0;
    }

    public async Task<GameOverride?> GetGameOverrideAsync(long gameID)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT GameID, Season, Week, SeasonType, HomeTeam, AwayTeam,
                   OriginalHomePoints, OriginalAwayPoints, OverrideHomePoints, OverrideAwayPoints,
                   Reason, CreatedAt, ModifiedAt
            FROM GameOverride
            WHERE GameID = @GameID
            """;
        command.Parameters.AddWithValue("@GameID", gameID);

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);

        if (!await reader.ReadAsync().ConfigureAwait(false))
            return null;

        return MapGameOverride(reader);
    }

    public async Task<IEnumerable<GameOverride>> GetGameOverridesBySeasonAsync(int season)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT GameID, Season, Week, SeasonType, HomeTeam, AwayTeam,
                   OriginalHomePoints, OriginalAwayPoints, OverrideHomePoints, OverrideAwayPoints,
                   Reason, CreatedAt, ModifiedAt
            FROM GameOverride
            WHERE Season = @Season
            ORDER BY Week, GameID
            """;
        command.Parameters.AddWithValue("@Season", season);

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);
        List<GameOverride> results = [];

        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            results.Add(MapGameOverride(reader));
        }

        return results;
    }

    public async Task InitializeAsync()
    {
        EnsureDirectoryExists();

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            CREATE TABLE IF NOT EXISTS GameOverride (
                GameID INTEGER NOT NULL PRIMARY KEY,
                Season INTEGER NOT NULL,
                Week INTEGER NOT NULL,
                SeasonType TEXT NOT NULL,
                HomeTeam TEXT NOT NULL,
                AwayTeam TEXT NOT NULL,
                OriginalHomePoints INTEGER NOT NULL,
                OriginalAwayPoints INTEGER NOT NULL,
                OverrideHomePoints INTEGER NOT NULL,
                OverrideAwayPoints INTEGER NOT NULL,
                Reason TEXT NOT NULL,
                CreatedAt TEXT NOT NULL,
                ModifiedAt TEXT NOT NULL
            )
            """;
        await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        await using var indexCommand = connection.CreateCommand();
        indexCommand.CommandText = "CREATE INDEX IF NOT EXISTS IX_GameOverride_Season ON GameOverride(Season)";
        await indexCommand.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Database initialized");
    }

    public async Task<bool> SaveGameOverrideAsync(GameOverride gameOverride)
    {
        ArgumentNullException.ThrowIfNull(gameOverride);

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT OR REPLACE INTO GameOverride
                (GameID, Season, Week, SeasonType, HomeTeam, AwayTeam,
                 OriginalHomePoints, OriginalAwayPoints, OverrideHomePoints, OverrideAwayPoints,
                 Reason, CreatedAt, ModifiedAt)
            VALUES
                (@GameID, @Season, @Week, @SeasonType, @HomeTeam, @AwayTeam,
                 @OriginalHomePoints, @OriginalAwayPoints, @OverrideHomePoints, @OverrideAwayPoints,
                 @Reason, @CreatedAt, @ModifiedAt)
            """;
        command.Parameters.AddWithValue("@GameID", gameOverride.GameID);
        command.Parameters.AddWithValue("@Season", gameOverride.Season);
        command.Parameters.AddWithValue("@Week", gameOverride.Week);
        command.Parameters.AddWithValue("@SeasonType", gameOverride.SeasonType);
        command.Parameters.AddWithValue("@HomeTeam", gameOverride.HomeTeam);
        command.Parameters.AddWithValue("@AwayTeam", gameOverride.AwayTeam);
        command.Parameters.AddWithValue("@OriginalHomePoints", gameOverride.OriginalHomePoints);
        command.Parameters.AddWithValue("@OriginalAwayPoints", gameOverride.OriginalAwayPoints);
        command.Parameters.AddWithValue("@OverrideHomePoints", gameOverride.OverrideHomePoints);
        command.Parameters.AddWithValue("@OverrideAwayPoints", gameOverride.OverrideAwayPoints);
        command.Parameters.AddWithValue("@Reason", gameOverride.Reason);
        command.Parameters.AddWithValue("@CreatedAt", gameOverride.CreatedAt.ToString("o"));
        command.Parameters.AddWithValue("@ModifiedAt", gameOverride.ModifiedAt.ToString("o"));

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Saved game override for game {GameID}", gameOverride.GameID);

        return rowsAffected > 0;
    }

    private static GameOverride MapGameOverride(SqliteDataReader reader)
    {
        return new GameOverride
        {
            GameID = reader.GetInt64(0),
            Season = reader.GetInt32(1),
            Week = reader.GetInt32(2),
            SeasonType = reader.GetString(3),
            HomeTeam = reader.GetString(4),
            AwayTeam = reader.GetString(5),
            OriginalHomePoints = reader.GetInt32(6),
            OriginalAwayPoints = reader.GetInt32(7),
            OverrideHomePoints = reader.GetInt32(8),
            OverrideAwayPoints = reader.GetInt32(9),
            Reason = reader.GetString(10),
            CreatedAt = DateTime.Parse(reader.GetString(11), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind),
            ModifiedAt = DateTime.Parse(reader.GetString(12), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind)
        };
    }

    private void EnsureDirectoryExists()
    {
        var builder = new SqliteConnectionStringBuilder(_connectionString);
        var dataSource = builder.DataSource;

        if (string.IsNullOrEmpty(dataSource) || dataSource == ":memory:")
            return;

        var directory = Path.GetDirectoryName(dataSource);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
            _logger.LogInformation("Created database directory: {Directory}", directory);
        }
    }
}
