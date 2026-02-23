using CFBPoll.Core.Data;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Data;

public class PageVisibilityDataTests
{
    [Fact]
    public async Task InitializeAsync_CreatesTableAndDefaultRow()
    {
        var (data, tempPath) = CreatePageVisibilityDataWithFile();
        try
        {
            await data.InitializeAsync();

            await using var connection = new SqliteConnection($"Data Source={tempPath};Pooling=false");
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='PageVisibility'";
            var result = await command.ExecuteScalarAsync();

            Assert.Equal("PageVisibility", result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPageVisibilityAsync_ReturnsDefaults_WhenNoUpdates()
    {
        var (data, tempPath) = CreatePageVisibilityDataWithFile();
        try
        {
            await data.InitializeAsync();

            var result = await data.GetPageVisibilityAsync();

            Assert.True(result.AllTimeEnabled);
            Assert.True(result.PollLeadersEnabled);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task UpdatePageVisibilityAsync_PersistsChanges()
    {
        var (data, tempPath) = CreatePageVisibilityDataWithFile();
        try
        {
            await data.InitializeAsync();

            var visibility = new PageVisibility
            {
                AllTimeEnabled = false,
                PollLeadersEnabled = false
            };

            var updated = await data.UpdatePageVisibilityAsync(visibility);

            Assert.True(updated);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPageVisibilityAsync_ReturnsUpdatedValues_AfterUpdate()
    {
        var (data, tempPath) = CreatePageVisibilityDataWithFile();
        try
        {
            await data.InitializeAsync();

            var visibility = new PageVisibility
            {
                AllTimeEnabled = false,
                PollLeadersEnabled = true
            };
            await data.UpdatePageVisibilityAsync(visibility);

            var result = await data.GetPageVisibilityAsync();

            Assert.False(result.AllTimeEnabled);
            Assert.True(result.PollLeadersEnabled);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task UpdatePageVisibilityAsync_OverwritesPreviousValues()
    {
        var (data, tempPath) = CreatePageVisibilityDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.UpdatePageVisibilityAsync(new PageVisibility
            {
                AllTimeEnabled = false,
                PollLeadersEnabled = false
            });

            await data.UpdatePageVisibilityAsync(new PageVisibility
            {
                AllTimeEnabled = true,
                PollLeadersEnabled = false
            });

            var result = await data.GetPageVisibilityAsync();

            Assert.True(result.AllTimeEnabled);
            Assert.False(result.PollLeadersEnabled);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public void Constructor_NullOptions_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new PageVisibilityData(null!, new Mock<ILogger<PageVisibilityData>>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        var options = new Mock<IOptions<DatabaseOptions>>();
        options.Setup(x => x.Value).Returns(new DatabaseOptions());

        Assert.Throws<ArgumentNullException>(() =>
            new PageVisibilityData(options.Object, null!));
    }

    [Fact]
    public async Task UpdatePageVisibilityAsync_NullVisibility_ThrowsArgumentNullException()
    {
        var (data, tempPath) = CreatePageVisibilityDataWithFile();
        try
        {
            await data.InitializeAsync();
            await Assert.ThrowsAsync<ArgumentNullException>(() => data.UpdatePageVisibilityAsync(null!));
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task InitializeAsync_ReturnsTrue()
    {
        var (data, tempPath) = CreatePageVisibilityDataWithFile();
        try
        {
            var result = await data.InitializeAsync();

            Assert.True(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task InitializeAsync_CalledTwice_DoesNotThrow()
    {
        var (data, tempPath) = CreatePageVisibilityDataWithFile();
        try
        {
            await data.InitializeAsync();
            await data.InitializeAsync();

            var result = await data.GetPageVisibilityAsync();

            Assert.True(result.AllTimeEnabled);
            Assert.True(result.PollLeadersEnabled);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    private static (PageVisibilityData data, string filePath) CreatePageVisibilityDataWithFile()
    {
        var tempPath = Path.Combine(Path.GetTempPath(), $"cfbpoll_test_{Guid.NewGuid()}.db");

        var options = new Mock<IOptions<DatabaseOptions>>();
        options.Setup(x => x.Value).Returns(new DatabaseOptions
        {
            ConnectionString = $"Data Source={tempPath};Pooling=false"
        });

        var logger = new Mock<ILogger<PageVisibilityData>>();
        return (new PageVisibilityData(options.Object, logger.Object), tempPath);
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
}
