using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
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

    public async Task<bool> DeleteRankingsSnapshotAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM RankingsSnapshot WHERE Season = @Season AND Week = @Week";
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Deleted rankings snapshot for season {Season}, week {Week}: {RowsAffected} rows affected",
            season, week, rowsAffected);

        return rowsAffected > 0;
    }

    public async Task<int?> GetLatestPublishedSeasonAsync()
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT Season FROM RankingsSnapshot WHERE Published = 1 ORDER BY Season DESC, Week DESC LIMIT 1";

        var result = await command.ExecuteScalarAsync().ConfigureAwait(false);

        return result is long season ? (int)season : null;
    }

    public async Task<RankingsResult?> GetPreviousPublishedRankingsSnapshotAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT RankingsJson FROM RankingsSnapshot
            WHERE Season = @Season AND Week < @Week AND Published = 1
            ORDER BY Week DESC LIMIT 1
            """;
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        var result = await command.ExecuteScalarAsync().ConfigureAwait(false);

        if (result is not string json)
            return null;

        return JsonSerializer.Deserialize<RankingsResult>(json);
    }

    public async Task<RankingsResult?> GetPublishedRankingsSnapshotAsync(int season, int week)
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

    public async Task<IEnumerable<RankingsResult>> GetPublishedRankingsSnapshotsBySeasonRangeAsync(int minSeason, int maxSeason)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT RankingsJson FROM RankingsSnapshot
            WHERE Published = 1 AND Season >= @MinSeason AND Season <= @MaxSeason
            ORDER BY Season, Week
            """;
        command.Parameters.AddWithValue("@MinSeason", minSeason);
        command.Parameters.AddWithValue("@MaxSeason", maxSeason);

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);
        List<RankingsResult> results = [];

        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var result = JsonSerializer.Deserialize<RankingsResult>(json);

            if (result is not null)
                results.Add(result);
        }

        _logger.LogDebug(
            "Fetched {Count} published rankings snapshots for seasons {MinSeason} to {MaxSeason}",
            results.Count, minSeason, maxSeason);

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

    public async Task<RankingsResult?> GetRankingsSnapshotAsync(int season, int week)
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

    public async Task<IEnumerable<RankingsSnapshotSummary>> GetRankingsSnapshotsAsync()
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT Season, Week, Published, CreatedAt, AlgorithmVersion FROM RankingsSnapshot ORDER BY Season DESC, Week DESC";

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);
        List<RankingsSnapshotSummary> results = [];

        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            results.Add(new RankingsSnapshotSummary
            {
                Season = reader.GetInt32(0),
                Week = reader.GetInt32(1),
                IsPublished = reader.GetInt32(2) == 1,
                CreatedAt = DateTime.Parse(reader.GetString(3), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind),
                AlgorithmVersion = Enum.Parse<RatingAlgorithmVersion>(reader.GetString(4))
            });
        }

        return results;
    }

    public async Task<IEnumerable<RankingsSnapshotScoreOverrides>> GetSnapshotScoreOverridesAsync()
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Season, Week, json_extract(RankingsJson, '$.ScoreOverrides')
            FROM RankingsSnapshot
            WHERE json_array_length(RankingsJson, '$.ScoreOverrides') > 0
            ORDER BY Season, Week
            """;

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);
        List<RankingsSnapshotScoreOverrides> results = [];

        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            var scoreOverrides = JsonSerializer.Deserialize<List<AppliedScoreOverride>>(reader.GetString(2));
            if (scoreOverrides is null)
                continue;

            results.Add(new RankingsSnapshotScoreOverrides
            {
                ScoreOverrides = scoreOverrides,
                Season = reader.GetInt32(0),
                Week = reader.GetInt32(1)
            });
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

        await TryAddColumnAsync(connection, "AlgorithmVersion TEXT NOT NULL DEFAULT 'V1'").ConfigureAwait(false);

        _logger.LogInformation("Database initialized");
    }

    public async Task<bool> PublishRankingsSnapshotAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "UPDATE RankingsSnapshot SET Published = 1 WHERE Season = @Season AND Week = @Week";
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Published rankings snapshot for season {Season}, week {Week}: {RowsAffected} rows affected",
            season, week, rowsAffected);

        return rowsAffected > 0;
    }

    public async Task<bool> SaveRankingsSnapshotAsync(RankingsResult rankings, RatingAlgorithmVersion algorithmVersion)
    {
        ArgumentNullException.ThrowIfNull(rankings);

        var json = JsonSerializer.Serialize(rankings);

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT OR REPLACE INTO RankingsSnapshot (Season, Week, RankingsJson, Published, CreatedAt, AlgorithmVersion)
            VALUES (@Season, @Week, @RankingsJson, 0, @CreatedAt, @AlgorithmVersion)
            """;
        command.Parameters.AddWithValue("@Season", rankings.Season);
        command.Parameters.AddWithValue("@Week", rankings.Week);
        command.Parameters.AddWithValue("@RankingsJson", json);
        command.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow.ToString("o"));
        command.Parameters.AddWithValue("@AlgorithmVersion", algorithmVersion.ToString());

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Saved rankings snapshot for season {Season}, week {Week}", rankings.Season, rankings.Week);

        return rowsAffected > 0;
    }

    public async Task<int> UpdateScoreOverrideReasonAsync(int season, long gameID, string reason)
    {
        ArgumentNullException.ThrowIfNull(reason);

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var transaction = (SqliteTransaction)await connection.BeginTransactionAsync().ConfigureAwait(false);

        List<(int Week, string Json)> updates = [];

        await using (var selectCommand = connection.CreateCommand())
        {
            selectCommand.Transaction = transaction;
            selectCommand.CommandText = """
                SELECT Week, RankingsJson FROM RankingsSnapshot
                WHERE Season = @Season AND json_array_length(RankingsJson, '$.ScoreOverrides') > 0
                """;
            selectCommand.Parameters.AddWithValue("@Season", season);

            await using var reader = await selectCommand.ExecuteReaderAsync().ConfigureAwait(false);

            while (await reader.ReadAsync().ConfigureAwait(false))
            {
                var updatedJson = ReplaceScoreOverrideReason(reader.GetString(1), gameID, reason);
                if (updatedJson is not null)
                {
                    updates.Add((reader.GetInt32(0), updatedJson));
                }
            }
        }

        foreach (var (week, json) in updates)
        {
            await using var updateCommand = connection.CreateCommand();
            updateCommand.Transaction = transaction;
            updateCommand.CommandText = "UPDATE RankingsSnapshot SET RankingsJson = @RankingsJson WHERE Season = @Season AND Week = @Week";
            updateCommand.Parameters.AddWithValue("@RankingsJson", json);
            updateCommand.Parameters.AddWithValue("@Season", season);
            updateCommand.Parameters.AddWithValue("@Week", week);
            await updateCommand.ExecuteNonQueryAsync().ConfigureAwait(false);
        }

        await transaction.CommitAsync().ConfigureAwait(false);

        _logger.LogInformation(
            "Updated the score override reason for game {GameID} in {Count} rankings snapshots for season {Season}",
            gameID, updates.Count, season);

        return updates.Count;
    }

    /// <summary>
    /// Edits only the reason of the matching embedded override, leaving the rest of the snapshot exactly
    /// as stored. Returns null when nothing needed to change.
    /// </summary>
    private static string? ReplaceScoreOverrideReason(string rankingsJson, long gameID, string reason)
    {
        var root = JsonNode.Parse(rankingsJson);
        if (root?["ScoreOverrides"] is not JsonArray scoreOverrides)
            return null;

        var changed = false;

        foreach (var entry in scoreOverrides.OfType<JsonObject>())
        {
            if ((long?)entry["GameID"] != gameID || (string?)entry["Reason"] == reason)
                continue;

            entry["Reason"] = reason;
            changed = true;
        }

        return changed ? root.ToJsonString() : null;
    }

    /// <summary>
    /// Adds a new column to the rankings table if it does not already exist.
    /// This is the de facto migration mechanism for this table since it has no separate migrations folder.
    /// </summary>
    private static async Task TryAddColumnAsync(SqliteConnection connection, string columnDefinition)
    {
        try
        {
            await using var alterCommand = connection.CreateCommand();
            alterCommand.CommandText = $"ALTER TABLE RankingsSnapshot ADD COLUMN {columnDefinition}";
            await alterCommand.ExecuteNonQueryAsync().ConfigureAwait(false);
        }
        catch (SqliteException)
        {
            // Column already exists — safe to ignore
        }
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
