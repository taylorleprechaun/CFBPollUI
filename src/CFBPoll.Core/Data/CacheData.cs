using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Data;

public class CacheData : ICacheData
{
    private readonly string _connectionString;
    private readonly ILogger<CacheData> _logger;

    public CacheData(IOptions<CacheOptions> options, ILogger<CacheData> logger)
    {
        _connectionString = options?.Value?.ConnectionString
            ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<int> DeleteExpiredAsync(DateTime utcNow)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM CacheEntry WHERE ExpiresAt < @UtcNow";
        command.Parameters.AddWithValue("@UtcNow", utcNow.ToString("o"));

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Deleted {Count} expired cache entries", rowsAffected);

        return rowsAffected;
    }

    public async Task<CacheDataEntry?> GetEntryAsync(string key)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT CacheKey, Data, CachedAt, ExpiresAt FROM CacheEntry WHERE CacheKey = @CacheKey";
        command.Parameters.AddWithValue("@CacheKey", key);

        await using var reader = await command.ExecuteReaderAsync().ConfigureAwait(false);

        if (!await reader.ReadAsync().ConfigureAwait(false))
            return null;

        return new CacheDataEntry
        {
            CacheKey = reader.GetString(0),
            Data = (byte[])reader[1],
            CachedAt = DateTime.Parse(reader.GetString(2)),
            ExpiresAt = DateTime.Parse(reader.GetString(3))
        };
    }

    public async Task InitializeAsync()
    {
        EnsureDirectoryExists();

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var walCommand = connection.CreateCommand();
        walCommand.CommandText = "PRAGMA journal_mode=WAL";
        await walCommand.ExecuteNonQueryAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            CREATE TABLE IF NOT EXISTS CacheEntry (
                CacheKey TEXT PRIMARY KEY,
                Data BLOB NOT NULL,
                CachedAt TEXT NOT NULL,
                ExpiresAt TEXT NOT NULL
            )
            """;

        await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogInformation("Cache database initialized");
    }

    public async Task<bool> RemoveAsync(string key)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM CacheEntry WHERE CacheKey = @CacheKey";
        command.Parameters.AddWithValue("@CacheKey", key);

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogDebug("Removed cache entry for key {CacheKey}: {RowsAffected} rows affected", key, rowsAffected);

        return rowsAffected > 0;
    }

    public async Task<bool> SetEntryAsync(CacheDataEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT OR REPLACE INTO CacheEntry (CacheKey, Data, CachedAt, ExpiresAt)
            VALUES (@CacheKey, @Data, @CachedAt, @ExpiresAt)
            """;
        command.Parameters.AddWithValue("@CacheKey", entry.CacheKey);
        command.Parameters.AddWithValue("@Data", entry.Data);
        command.Parameters.AddWithValue("@CachedAt", entry.CachedAt.ToString("o"));
        command.Parameters.AddWithValue("@ExpiresAt", entry.ExpiresAt.ToString("o"));

        var rowsAffected = await command.ExecuteNonQueryAsync().ConfigureAwait(false);

        _logger.LogDebug("Set cache entry for key {CacheKey}", entry.CacheKey);

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
            _logger.LogInformation("Created cache database directory: {Directory}", directory);
        }
    }
}
