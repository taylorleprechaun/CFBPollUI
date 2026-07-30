using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Data;

public class PageVisibilityData : IPageVisibilityData
{
    private readonly string _connectionString;
    private readonly ILogger<PageVisibilityData> _logger;

    public PageVisibilityData(IOptions<DatabaseOptions> options, ILogger<PageVisibilityData> logger)
    {
        _connectionString = options?.Value?.ConnectionString
            ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<PageVisibility> GetPageVisibilityAsync()
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT AllTimeEnabled, PollLeadersEnabled, SeasonTrendsEnabled, PredictionsPageEnabled FROM PageVisibility WHERE Id = 1";

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);

        if (await reader.ReadAsync().ConfigureAwait(false))
        {
            return new PageVisibility
            {
                AllTimeEnabled = reader.GetInt32(0) == 1,
                PollLeadersEnabled = reader.GetInt32(1) == 1,
                PredictionsPageEnabled = reader.GetInt32(3) == 1,
                SeasonTrendsEnabled = reader.GetInt32(2) == 1
            };
        }

        return new PageVisibility
        {
            AllTimeEnabled = true,
            PollLeadersEnabled = true,
            PredictionsPageEnabled = true,
            SeasonTrendsEnabled = true
        };
    }

    public async Task<bool> InitializeAsync()
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var createCommand = connection.CreateCommand();
        createCommand.CommandText = """
            CREATE TABLE IF NOT EXISTS PageVisibility (
                Id INTEGER CONSTRAINT PK_PageVisibility PRIMARY KEY CONSTRAINT CK_PageVisibility_Id CHECK (Id = 1),
                AllTimeEnabled INTEGER NOT NULL CONSTRAINT DF_PageVisibility_AllTimeEnabled DEFAULT 1,
                PollLeadersEnabled INTEGER NOT NULL CONSTRAINT DF_PageVisibility_PollLeadersEnabled DEFAULT 1
            )
            """;

        await createCommand.ExecuteNonQueryAsync().ConfigureAwait(false);

        await using var seedCommand = connection.CreateCommand();
        seedCommand.CommandText = "INSERT OR IGNORE INTO PageVisibility (Id) VALUES (1)";
        await seedCommand.ExecuteNonQueryAsync().ConfigureAwait(false);

        await TryAddColumnAsync(connection, "SeasonTrendsEnabled").ConfigureAwait(false);
        await TryAddColumnAsync(connection, "PredictionsPageEnabled").ConfigureAwait(false);

        _logger.LogInformation("PageVisibility table initialized");

        return true;
    }

    public async Task<bool> UpdatePageVisibilityAsync(PageVisibility visibility)
    {
        ArgumentNullException.ThrowIfNull(visibility);

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE PageVisibility
            SET AllTimeEnabled = @AllTimeEnabled, PollLeadersEnabled = @PollLeadersEnabled, SeasonTrendsEnabled = @SeasonTrendsEnabled, PredictionsPageEnabled = @PredictionsPageEnabled
            WHERE Id = 1
            """;
        command.Parameters.AddWithValue("@AllTimeEnabled", visibility.AllTimeEnabled ? 1 : 0);
        command.Parameters.AddWithValue("@PollLeadersEnabled", visibility.PollLeadersEnabled ? 1 : 0);
        command.Parameters.AddWithValue("@SeasonTrendsEnabled", visibility.SeasonTrendsEnabled ? 1 : 0);
        command.Parameters.AddWithValue("@PredictionsPageEnabled", visibility.PredictionsPageEnabled ? 1 : 0);

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation(
            "Updated page visibility: AllTimeEnabled={AllTimeEnabled}, PollLeadersEnabled={PollLeadersEnabled}, SeasonTrendsEnabled={SeasonTrendsEnabled}, PredictionsPageEnabled={PredictionsPageEnabled}",
            visibility.AllTimeEnabled, visibility.PollLeadersEnabled, visibility.SeasonTrendsEnabled, visibility.PredictionsPageEnabled);

        return rowsAffected > 0;
    }

    /// <summary>
    /// Adds a new boolean page-visibility column, defaulting to enabled, if it does not already exist.
    /// This is the de facto migration mechanism for this table since it has no separate migrations folder.
    /// </summary>
    private static async Task TryAddColumnAsync(SqliteConnection connection, string columnName)
    {
        try
        {
            await using var alterCommand = connection.CreateCommand();
            alterCommand.CommandText = $"ALTER TABLE PageVisibility ADD COLUMN {columnName} INTEGER NOT NULL DEFAULT 1";
            await alterCommand.ExecuteNonQueryAsync().ConfigureAwait(false);
        }
        catch (SqliteException)
        {
            // Column already exists — safe to ignore
        }
    }
}
