using CFBPoll.Core.Data;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Data;

public class RankingsDataTests
{
    [Fact]
    public async Task InitializeAsync_CreatesTable()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await using var connection = new SqliteConnection($"Data Source={tempPath}");
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='RankingsSnapshot'";
            var result = await command.ExecuteScalarAsync();

            Assert.Equal("RankingsSnapshot", result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveSnapshotAsync_AndGetSnapshotAsync_RoundTrips()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var rankings = CreateRankingsResult(2024, 5);
            await data.SaveSnapshotAsync(rankings);

            var result = await data.GetSnapshotAsync(2024, 5);

            Assert.NotNull(result);
            Assert.Equal(2024, result.Season);
            Assert.Equal(5, result.Week);
            Assert.Single(result.Rankings);
            Assert.Equal("Team A", result.Rankings.First().TeamName);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveSnapshotAsync_ReplacesExistingSnapshot()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var original = CreateRankingsResult(2024, 5, "Team A");
            await data.SaveSnapshotAsync(original);

            var replacement = CreateRankingsResult(2024, 5, "Team B");
            await data.SaveSnapshotAsync(replacement);

            var result = await data.GetSnapshotAsync(2024, 5);

            Assert.NotNull(result);
            Assert.Equal("Team B", result.Rankings.First().TeamName);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveSnapshotAsync_ResetsPublishedFlag()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveSnapshotAsync(CreateRankingsResult(2024, 5));
            await data.PublishSnapshotAsync(2024, 5);

            await data.SaveSnapshotAsync(CreateRankingsResult(2024, 5));

            var published = await data.GetPublishedSnapshotAsync(2024, 5);
            Assert.Null(published);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetSnapshotAsync_ReturnsNull_WhenNotFound()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var result = await data.GetSnapshotAsync(2024, 5);

            Assert.Null(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task DeleteSnapshotAsync_DeletesExisting_ReturnsTrue()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveSnapshotAsync(CreateRankingsResult(2024, 5));
            var deleted = await data.DeleteSnapshotAsync(2024, 5);

            Assert.True(deleted);

            var result = await data.GetSnapshotAsync(2024, 5);
            Assert.Null(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task DeleteSnapshotAsync_NonExisting_ReturnsFalse()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var deleted = await data.DeleteSnapshotAsync(2024, 5);

            Assert.False(deleted);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task PublishSnapshotAsync_SetsPublishedFlag()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveSnapshotAsync(CreateRankingsResult(2024, 5));
            var published = await data.PublishSnapshotAsync(2024, 5);

            Assert.True(published);

            var result = await data.GetPublishedSnapshotAsync(2024, 5);
            Assert.NotNull(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task PublishSnapshotAsync_ReturnsFalse_WhenNotFound()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var published = await data.PublishSnapshotAsync(2024, 5);

            Assert.False(published);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPublishedSnapshotAsync_ReturnsNull_ForDrafts()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveSnapshotAsync(CreateRankingsResult(2024, 5));

            var result = await data.GetPublishedSnapshotAsync(2024, 5);
            Assert.Null(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPublishedSnapshotAsync_ReturnsPublished()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveSnapshotAsync(CreateRankingsResult(2024, 5));
            await data.PublishSnapshotAsync(2024, 5);

            var result = await data.GetPublishedSnapshotAsync(2024, 5);

            Assert.NotNull(result);
            Assert.Equal(2024, result.Season);
            Assert.Equal(5, result.Week);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPersistedWeeksAsync_ReturnsAllSnapshots()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveSnapshotAsync(CreateRankingsResult(2024, 1));
            await data.SaveSnapshotAsync(CreateRankingsResult(2024, 2));
            await data.SaveSnapshotAsync(CreateRankingsResult(2023, 5));
            await data.PublishSnapshotAsync(2024, 1);

            var weeks = (await data.GetPersistedWeeksAsync()).ToList();

            Assert.Equal(3, weeks.Count);
            Assert.Contains(weeks, w => w.Season == 2024 && w.Week == 1 && w.Published);
            Assert.Contains(weeks, w => w.Season == 2024 && w.Week == 2 && !w.Published);
            Assert.Contains(weeks, w => w.Season == 2023 && w.Week == 5 && !w.Published);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPublishedWeekNumbersAsync_ReturnsOnlyPublished()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveSnapshotAsync(CreateRankingsResult(2024, 1));
            await data.SaveSnapshotAsync(CreateRankingsResult(2024, 2));
            await data.SaveSnapshotAsync(CreateRankingsResult(2024, 3));
            await data.PublishSnapshotAsync(2024, 1);
            await data.PublishSnapshotAsync(2024, 3);

            var publishedWeeks = (await data.GetPublishedWeekNumbersAsync(2024)).ToList();

            Assert.Equal(2, publishedWeeks.Count);
            Assert.Contains(1, publishedWeeks);
            Assert.Contains(3, publishedWeeks);
            Assert.DoesNotContain(2, publishedWeeks);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPublishedWeekNumbersAsync_FiltersCorrectlyBySeason()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveSnapshotAsync(CreateRankingsResult(2023, 1));
            await data.SaveSnapshotAsync(CreateRankingsResult(2024, 1));
            await data.PublishSnapshotAsync(2023, 1);
            await data.PublishSnapshotAsync(2024, 1);

            var publishedWeeks = (await data.GetPublishedWeekNumbersAsync(2024)).ToList();

            Assert.Single(publishedWeeks);
            Assert.Contains(1, publishedWeeks);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public void Constructor_ThrowsOnNullOptions()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new RankingsData(null!, new Mock<ILogger<RankingsData>>().Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullLogger()
    {
        var options = new Mock<IOptions<DatabaseOptions>>();
        options.Setup(x => x.Value).Returns(new DatabaseOptions());

        Assert.Throws<ArgumentNullException>(() =>
            new RankingsData(options.Object, null!));
    }

    [Fact]
    public async Task SaveSnapshotAsync_ThrowsOnNullRankings()
    {
        var (data, tempPath) = CreateRankingsDataWithFile();
        try
        {
            await data.InitializeAsync();
            await Assert.ThrowsAsync<ArgumentNullException>(() => data.SaveSnapshotAsync(null!));
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    private static (RankingsData data, string filePath) CreateRankingsDataWithFile()
    {
        var tempPath = Path.Combine(Path.GetTempPath(), $"cfbpoll_test_{Guid.NewGuid()}.db");

        var options = new Mock<IOptions<DatabaseOptions>>();
        options.Setup(x => x.Value).Returns(new DatabaseOptions
        {
            ConnectionString = $"Data Source={tempPath}"
        });

        var logger = new Mock<ILogger<RankingsData>>();
        return (new RankingsData(options.Object, logger.Object), tempPath);
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

    private static RankingsResult CreateRankingsResult(int season, int week, string teamName = "Team A")
    {
        return new RankingsResult
        {
            Season = season,
            Week = week,
            Rankings =
            [
                new RankedTeam
                {
                    TeamName = teamName,
                    Rank = 1,
                    Rating = 90.0,
                    Conference = "Big Ten",
                    Division = "East",
                    Wins = 5,
                    Losses = 1,
                    Details = new TeamDetails()
                }
            ]
        };
    }
}
