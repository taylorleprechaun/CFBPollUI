using System.Text.Json;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Data;

public class PredictionsData : IPredictionsData
{
    private readonly string _connectionString;
    private readonly ILogger<PredictionsData> _logger;

    public PredictionsData(IOptions<DatabaseOptions> options, ILogger<PredictionsData> logger)
    {
        _connectionString = options?.Value?.ConnectionString
            ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<bool> AreResultsPublishedAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT ResultsPublished FROM PredictionsSnapshot WHERE Season = @Season AND Week = @Week";
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        var result = await command.ExecuteScalarAsync().ConfigureAwait(false);

        return result is long value && value == 1;
    }

    public async Task<bool> DeleteAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM PredictionsSnapshot WHERE Season = @Season AND Week = @Week";
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Deleted predictions for season {Season}, week {Week}: {RowsAffected} rows affected",
            season, week, rowsAffected);

        return rowsAffected > 0;
    }

    public async Task<IEnumerable<PredictionsSummary>> GetAllSummariesAsync()
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT Season, Week, Published, CreatedAt, GameCount, Graded, ResultsPublished, GradedAt FROM PredictionsSnapshot ORDER BY Season DESC, Week DESC";

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);
        List<PredictionsSummary> results = [];

        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            results.Add(new PredictionsSummary
            {
                Season = reader.GetInt32(0),
                Week = reader.GetInt32(1),
                IsPublished = reader.GetInt32(2) == 1,
                CreatedAt = DateTime.Parse(reader.GetString(3)),
                GameCount = reader.GetInt32(4),
                IsGraded = reader.GetInt32(5) == 1,
                ResultsPublished = reader.GetInt32(6) == 1,
                GradedAt = reader.IsDBNull(7) ? null : DateTime.Parse(reader.GetString(7))
            });
        }

        return results;
    }

    public async Task<PredictionsResult?> GetAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT PredictionsJson FROM PredictionsSnapshot WHERE Season = @Season AND Week = @Week";
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        var result = await command.ExecuteScalarAsync().ConfigureAwait(false);

        if (result is not string json)
            return null;

        return JsonSerializer.Deserialize<PredictionsResult>(json);
    }

    public async Task<(PredictionsResult Predictions, bool ResultsPublished)?> GetPublishedAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT PredictionsJson, ResultsPublished FROM PredictionsSnapshot WHERE Season = @Season AND Week = @Week AND Published = 1";
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);

        if (!await reader.ReadAsync().ConfigureAwait(false))
            return null;

        var predictions = JsonSerializer.Deserialize<PredictionsResult>(reader.GetString(0));
        if (predictions is null)
            return null;

        return (predictions, reader.GetInt32(1) == 1);
    }

    public async Task<IEnumerable<int>> GetPublishedSeasonsAsync()
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT DISTINCT Season FROM PredictionsSnapshot WHERE Published = 1 ORDER BY Season DESC";

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);
        List<int> seasons = [];

        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            seasons.Add(reader.GetInt32(0));
        }

        return seasons;
    }

    public async Task<IEnumerable<int>> GetPublishedWeekNumbersAsync(int season)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT Week FROM PredictionsSnapshot WHERE Season = @Season AND Published = 1 ORDER BY Week";
        command.Parameters.AddWithValue("@Season", season);

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);
        List<int> weeks = [];

        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            weeks.Add(reader.GetInt32(0));
        }

        return weeks;
    }

    public async Task InitializeAsync()
    {
        EnsureDirectoryExists();

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            CREATE TABLE IF NOT EXISTS PredictionsSnapshot (
                Season INTEGER NOT NULL,
                Week INTEGER NOT NULL,
                PredictionsJson TEXT NOT NULL,
                Published INTEGER NOT NULL DEFAULT 0,
                CreatedAt TEXT NOT NULL,
                GameCount INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (Season, Week)
            )
            """;

        await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        await TryAddColumnAsync(connection, "Graded INTEGER NOT NULL DEFAULT 0").ConfigureAwait(false);
        await TryAddColumnAsync(connection, "ResultsPublished INTEGER NOT NULL DEFAULT 0").ConfigureAwait(false);
        await TryAddColumnAsync(connection, "GradedAt TEXT NULL").ConfigureAwait(false);

        _logger.LogInformation("Predictions database initialized");
    }

    public async Task<bool> PublishAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "UPDATE PredictionsSnapshot SET Published = 1 WHERE Season = @Season AND Week = @Week";
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Published predictions for season {Season}, week {Week}: {RowsAffected} rows affected",
            season, week, rowsAffected);

        return rowsAffected > 0;
    }

    public async Task<bool> PublishGradedResultsAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE PredictionsSnapshot SET ResultsPublished = 1
            WHERE Season = @Season AND Week = @Week AND Graded = 1 AND Published = 1
            """;
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Published graded results for season {Season}, week {Week}: {RowsAffected} rows affected",
            season, week, rowsAffected);

        return rowsAffected > 0;
    }

    public async Task<bool> SaveAsync(PredictionsResult predictions)
    {
        ArgumentNullException.ThrowIfNull(predictions);

        var json = JsonSerializer.Serialize(predictions);
        var gameCount = predictions.Predictions.Count;

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT OR REPLACE INTO PredictionsSnapshot (Season, Week, PredictionsJson, Published, CreatedAt, GameCount, Graded, ResultsPublished, GradedAt)
            VALUES (@Season, @Week, @PredictionsJson, 0, @CreatedAt, @GameCount, 0, 0, NULL)
            """;
        command.Parameters.AddWithValue("@Season", predictions.Season);
        command.Parameters.AddWithValue("@Week", predictions.Week);
        command.Parameters.AddWithValue("@PredictionsJson", json);
        command.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow.ToString("o"));
        command.Parameters.AddWithValue("@GameCount", gameCount);

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Saved predictions for season {Season}, week {Week} ({GameCount} games)",
            predictions.Season, predictions.Week, gameCount);

        return rowsAffected > 0;
    }

    public async Task<bool> SaveGradedResultAsync(PredictionsResult gradedPredictions)
    {
        ArgumentNullException.ThrowIfNull(gradedPredictions);

        var json = JsonSerializer.Serialize(gradedPredictions);

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE PredictionsSnapshot
            SET PredictionsJson = @PredictionsJson, Graded = 1, GradedAt = @GradedAt
            WHERE Season = @Season AND Week = @Week
            """;
        command.Parameters.AddWithValue("@Season", gradedPredictions.Season);
        command.Parameters.AddWithValue("@Week", gradedPredictions.Week);
        command.Parameters.AddWithValue("@PredictionsJson", json);
        command.Parameters.AddWithValue("@GradedAt", DateTime.UtcNow.ToString("o"));

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Saved graded results for season {Season}, week {Week}: {RowsAffected} rows affected",
            gradedPredictions.Season, gradedPredictions.Week, rowsAffected);

        return rowsAffected > 0;
    }

    /// <summary>
    /// Adds a new column to the predictions table if it does not already exist.
    /// This is the de facto migration mechanism for this table since it has no separate migrations folder.
    /// </summary>
    private static async Task TryAddColumnAsync(SqliteConnection connection, string columnDefinition)
    {
        try
        {
            await using var alterCommand = connection.CreateCommand();
            alterCommand.CommandText = $"ALTER TABLE PredictionsSnapshot ADD COLUMN {columnDefinition}";
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
