using System.Text.Json;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Data;

public class RankingsData : IRankingsData
{
    private readonly string _connectionString;
    private readonly ILogger<RankingsData> _logger;

    public RankingsData(IOptions<DatabaseOptions> options, ILogger<RankingsData> logger)
    {
        _connectionString = options?.Value?.ConnectionString
            ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<bool> DeleteSnapshotAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM RankingsSnapshot WHERE Season = @Season AND Week = @Week";
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Deleted snapshot for season {Season}, week {Week}: {RowsAffected} rows affected",
            season, week, rowsAffected);

        return rowsAffected > 0;
    }

    public async Task<IEnumerable<PersistedWeekSummary>> GetPersistedWeeksAsync()
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT Season, Week, Published, CreatedAt FROM RankingsSnapshot ORDER BY Season DESC, Week DESC";

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);
        List<PersistedWeekSummary> results = [];

        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            results.Add(new PersistedWeekSummary
            {
                Season = reader.GetInt32(0),
                Week = reader.GetInt32(1),
                Published = reader.GetInt32(2) == 1,
                CreatedAt = DateTime.Parse(reader.GetString(3))
            });
        }

        return results;
    }

    public async Task<IEnumerable<int>> GetPublishedWeekNumbersAsync(int season)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT Week FROM RankingsSnapshot WHERE Season = @Season AND Published = 1 ORDER BY Week";
        command.Parameters.AddWithValue("@Season", season);

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);
        List<int> weeks = [];

        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            weeks.Add(reader.GetInt32(0));
        }

        return weeks;
    }

    public async Task<RankingsResult?> GetPublishedSnapshotAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT RankingsJson FROM RankingsSnapshot WHERE Season = @Season AND Week = @Week AND Published = 1";
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        var result = await command.ExecuteScalarAsync().ConfigureAwait(false);

        if (result is not string json)
            return null;

        return JsonSerializer.Deserialize<RankingsResult>(json);
    }

    public async Task<RankingsResult?> GetSnapshotAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT RankingsJson FROM RankingsSnapshot WHERE Season = @Season AND Week = @Week";
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        var result = await command.ExecuteScalarAsync().ConfigureAwait(false);

        if (result is not string json)
            return null;

        return JsonSerializer.Deserialize<RankingsResult>(json);
    }

    public async Task InitializeAsync()
    {
        EnsureDirectoryExists();

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            CREATE TABLE IF NOT EXISTS RankingsSnapshot (
                Season INTEGER NOT NULL,
                Week INTEGER NOT NULL,
                RankingsJson TEXT NOT NULL,
                Published INTEGER NOT NULL DEFAULT 0,
                CreatedAt TEXT NOT NULL,
                PRIMARY KEY (Season, Week)
            )
            """;

        await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Database initialized");
    }

    public async Task<bool> PublishSnapshotAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "UPDATE RankingsSnapshot SET Published = 1 WHERE Season = @Season AND Week = @Week";
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Published snapshot for season {Season}, week {Week}: {RowsAffected} rows affected",
            season, week, rowsAffected);

        return rowsAffected > 0;
    }

    public async Task<bool> SaveSnapshotAsync(RankingsResult rankings)
    {
        ArgumentNullException.ThrowIfNull(rankings);

        var json = JsonSerializer.Serialize(rankings);

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT OR REPLACE INTO RankingsSnapshot (Season, Week, RankingsJson, Published, CreatedAt)
            VALUES (@Season, @Week, @RankingsJson, 0, @CreatedAt)
            """;
        command.Parameters.AddWithValue("@Season", rankings.Season);
        command.Parameters.AddWithValue("@Week", rankings.Week);
        command.Parameters.AddWithValue("@RankingsJson", json);
        command.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow.ToString("o"));

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Saved snapshot for season {Season}, week {Week}", rankings.Season, rankings.Week);

        return rowsAffected > 0;
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
