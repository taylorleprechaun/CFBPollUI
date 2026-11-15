using System.Globalization;
using System.Text.Json;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Data;

public class PredictionCalibrationData : IPredictionCalibrationData
{
    private const string SELECT_COLUMNS = "SELECT Season, Week, ValuesJson, Source, UpdatedAt FROM PredictionCalibration";

    private readonly string _connectionString;
    private readonly ILogger<PredictionCalibrationData> _logger;

    public PredictionCalibrationData(IOptions<DatabaseOptions> options, ILogger<PredictionCalibrationData> logger)
    {
        _connectionString = options?.Value?.ConnectionString
            ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<PredictionCalibration?> GetAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = $"{SELECT_COLUMNS} WHERE Season = @Season AND Week = @Week";
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);

        return await reader.ReadAsync().ConfigureAwait(false) ? ReadCalibration(reader) : null;
    }

    public async Task<PredictionCalibration?> GetLatestBeforeAsync(int season, int week)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = $"""
            {SELECT_COLUMNS}
            WHERE Season < @Season OR (Season = @Season AND Week < @Week)
            ORDER BY Season DESC, Week DESC
            LIMIT 1
            """;
        command.Parameters.AddWithValue("@Season", season);
        command.Parameters.AddWithValue("@Week", week);

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);

        return await reader.ReadAsync().ConfigureAwait(false) ? ReadCalibration(reader) : null;
    }

    public async Task<IEnumerable<PredictionCalibration>> GetSeasonAsync(int season)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = $"{SELECT_COLUMNS} WHERE Season = @Season ORDER BY Week";
        command.Parameters.AddWithValue("@Season", season);

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);
        List<PredictionCalibration> results = [];

        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            results.Add(ReadCalibration(reader));
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
            CREATE TABLE IF NOT EXISTS PredictionCalibration (
                Season INTEGER NOT NULL,
                Week INTEGER NOT NULL,
                ValuesJson TEXT NOT NULL,
                Source TEXT NOT NULL,
                UpdatedAt TEXT NOT NULL,
                PRIMARY KEY (Season, Week)
            )
            """;

        await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Prediction calibration database initialized");
    }

    public async Task<bool> SaveAsync(PredictionCalibration calibration)
    {
        ArgumentNullException.ThrowIfNull(calibration);

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT OR REPLACE INTO PredictionCalibration (Season, Week, ValuesJson, Source, UpdatedAt)
            VALUES (@Season, @Week, @ValuesJson, @Source, @UpdatedAt)
            """;
        command.Parameters.AddWithValue("@Season", calibration.Season);
        command.Parameters.AddWithValue("@Week", calibration.Week);
        command.Parameters.AddWithValue("@ValuesJson", JsonSerializer.Serialize(calibration.Values));
        command.Parameters.AddWithValue("@Source", calibration.Source.ToString());
        command.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow.ToString("o"));

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Saved prediction calibration for season {Season}, week {Week} ({Source})",
            calibration.Season, calibration.Week, calibration.Source);

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

    private PredictionCalibration ReadCalibration(SqliteDataReader reader)
    {
        return new PredictionCalibration
        {
            Season = reader.GetInt32(0),
            Week = reader.GetInt32(1),
            Values = JsonSerializer.Deserialize<Dictionary<string, double>>(reader.GetString(2)) ?? [],
            Source = Enum.TryParse<PredictionCalibrationSource>(reader.GetString(3), out var source)
                ? source
                : PredictionCalibrationSource.Manual,
            UpdatedAt = DateTime.Parse(reader.GetString(4), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind)
        };
    }
}
