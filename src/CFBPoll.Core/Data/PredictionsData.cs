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

    public async Task<IEnumerable<PredictionsSummary>> GetAllSummariesAsync()
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT Season, Week, Published, CreatedAt, GameCount FROM PredictionsSnapshot ORDER BY Season DESC, Week DESC";

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
                GameCount = reader.GetInt32(4)
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

    public async Task<bool> SaveAsync(PredictionsResult predictions)
    {
        ArgumentNullException.ThrowIfNull(predictions);

        var json = JsonSerializer.Serialize(predictions);
        var gameCount = predictions.Predictions.Count;

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT OR REPLACE INTO PredictionsSnapshot (Season, Week, PredictionsJson, Published, CreatedAt, GameCount)
            VALUES (@Season, @Week, @PredictionsJson, 0, @CreatedAt, @GameCount)
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
