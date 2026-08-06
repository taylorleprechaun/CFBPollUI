using CFBPoll.Core.Data;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Data;

public class PredictionsDataTests
{
    [Fact]
    public async Task AreResultsPublishedAsync_NoRow_ReturnsFalse()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var result = await data.AreResultsPublishedAsync(2024, 5);

            Assert.False(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task AreResultsPublishedAsync_ResultsNotPublished_ReturnsFalse()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));

            var result = await data.AreResultsPublishedAsync(2024, 5);

            Assert.False(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task AreResultsPublishedAsync_ResultsPublished_ReturnsTrue()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));
            await data.PublishAsync(2024, 5);
            await data.SaveGradedResultAsync(CreatePredictionsResult(2024, 5));
            await data.PublishGradedResultsAsync(2024, 5);

            var result = await data.AreResultsPublishedAsync(2024, 5);

            Assert.True(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public void Constructor_ThrowsOnNullLogger()
    {
        var options = new Mock<IOptions<DatabaseOptions>>();
        options.Setup(x => x.Value).Returns(new DatabaseOptions());

        Assert.Throws<ArgumentNullException>(() =>
            new PredictionsData(options.Object, null!));
    }

    [Fact]
    public void Constructor_ThrowsOnNullOptions()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new PredictionsData(null!, new Mock<ILogger<PredictionsData>>().Object));
    }

    [Fact]
    public async Task DeleteAsync_DeletesExisting_ReturnsTrue()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));
            var deleted = await data.DeleteAsync(2024, 5);

            Assert.True(deleted);

            var result = await data.GetAsync(2024, 5);
            Assert.Null(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task DeleteAsync_NonExisting_ReturnsFalse()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var deleted = await data.DeleteAsync(2024, 5);

            Assert.False(deleted);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetAllSummariesAsync_ReturnsAllSummaries()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 1));
            await data.SaveAsync(CreatePredictionsResult(2024, 2, "Nebraska", "USC"));
            await data.SaveAsync(CreatePredictionsResult(2023, 5));
            await data.PublishAsync(2024, 1);

            var summaries = (await data.GetAllSummariesAsync()).ToList();

            Assert.Equal(3, summaries.Count);
            Assert.Contains(summaries, s => s.Season == 2024 && s.Week == 1 && s.IsPublished && s.GameCount == 1);
            Assert.Contains(summaries, s => s.Season == 2024 && s.Week == 2 && !s.IsPublished && s.GameCount == 1);
            Assert.Contains(summaries, s => s.Season == 2023 && s.Week == 5 && !s.IsPublished && s.GameCount == 1);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetAllSummariesAsync_ReturnsCorrectGameCount()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var predictions = new PredictionsResult
            {
                Season = 2024,
                Week = 5,
                Predictions =
                [
                    new GamePrediction { AwayTeam = "Florida", HomeTeam = "Alabama", PredictedWinner = "Alabama", PredictedMargin = 10, HomeTeamScore = 31, AwayTeamScore = 21 },
                    new GamePrediction { AwayTeam = "Iowa", HomeTeam = "Nebraska", PredictedWinner = "Nebraska", PredictedMargin = 3, HomeTeamScore = 24, AwayTeamScore = 21 },
                    new GamePrediction { AwayTeam = "USC", HomeTeam = "Notre Dame", PredictedWinner = "Notre Dame", PredictedMargin = 7, HomeTeamScore = 28, AwayTeamScore = 21 }
                ]
            };

            await data.SaveAsync(predictions);

            var summaries = (await data.GetAllSummariesAsync()).ToList();
            Assert.Equal(3, summaries.Single().GameCount);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetAsync_ReturnsNull_WhenNotFound()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var result = await data.GetAsync(2024, 5);

            Assert.Null(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPublishedAsync_NotFound_ReturnsNull()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var result = await data.GetPublishedAsync(2024, 5);

            Assert.Null(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPublishedAsync_NotPublished_ReturnsNull()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));

            var result = await data.GetPublishedAsync(2024, 5);

            Assert.Null(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPublishedAsync_Published_ReturnsResult()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));
            await data.PublishAsync(2024, 5);

            var result = await data.GetPublishedAsync(2024, 5);

            Assert.NotNull(result);
            Assert.Equal(2024, result.Value.Predictions.Season);
            Assert.Equal(5, result.Value.Predictions.Week);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPublishedAsync_ResultsNotPublished_ReturnsResultsPublishedFalse()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));
            await data.PublishAsync(2024, 5);

            var result = await data.GetPublishedAsync(2024, 5);

            Assert.NotNull(result);
            Assert.False(result.Value.ResultsPublished);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPublishedAsync_ResultsPublished_ReturnsResultsPublishedTrue()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));
            await data.PublishAsync(2024, 5);
            await data.SaveGradedResultAsync(CreatePredictionsResult(2024, 5));
            await data.PublishGradedResultsAsync(2024, 5);

            var result = await data.GetPublishedAsync(2024, 5);

            Assert.NotNull(result);
            Assert.True(result.Value.ResultsPublished);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }
    [Fact]
    public async Task GetPublishedSeasonsAsync_NoPublishedWeeks_ReturnsEmpty()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 1));

            var seasons = (await data.GetPublishedSeasonsAsync()).ToList();

            Assert.Empty(seasons);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPublishedSeasonsAsync_ReturnsDistinctSeasonsDescending()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2023, 1));
            await data.SaveAsync(CreatePredictionsResult(2024, 1));
            await data.SaveAsync(CreatePredictionsResult(2024, 2));
            await data.SaveAsync(CreatePredictionsResult(2025, 1));
            await data.PublishAsync(2023, 1);
            await data.PublishAsync(2024, 1);
            await data.PublishAsync(2024, 2);

            var seasons = (await data.GetPublishedSeasonsAsync()).ToList();

            Assert.Equal(new List<int> { 2024, 2023 }, seasons);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPublishedWeekNumbersAsync_NoPublishedWeeks_ReturnsEmpty()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 1));

            var weeks = (await data.GetPublishedWeekNumbersAsync(2024)).ToList();

            Assert.Empty(weeks);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetPublishedWeekNumbersAsync_ReturnsOnlyPublishedWeeks()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 1));
            await data.SaveAsync(CreatePredictionsResult(2024, 2));
            await data.SaveAsync(CreatePredictionsResult(2024, 3));
            await data.PublishAsync(2024, 1);
            await data.PublishAsync(2024, 3);

            var weeks = (await data.GetPublishedWeekNumbersAsync(2024)).ToList();

            Assert.Equal(new List<int> { 1, 3 }, weeks);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task InitializeAsync_CalledTwice_DoesNotThrow()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));
            var result = await data.GetAsync(2024, 5);

            Assert.NotNull(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task InitializeAsync_CreatesTable()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await using var connection = new SqliteConnection($"Data Source={tempPath};Pooling=false");
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='PredictionsSnapshot'";
            var result = await command.ExecuteScalarAsync();

            Assert.Equal("PredictionsSnapshot", result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task InitializeAsync_DatabaseDirectoryDoesNotExist_CreatesDirectory()
    {
        var directory = Path.Combine(Path.GetTempPath(), $"cfbpoll_pred_test_dir_{Guid.NewGuid()}");
        var tempPath = Path.Combine(directory, "predictions.db");
        var options = new Mock<IOptions<DatabaseOptions>>();
        options.Setup(x => x.Value).Returns(new DatabaseOptions
        {
            ConnectionString = $"Data Source={tempPath};Pooling=false"
        });
        var logger = new Mock<ILogger<PredictionsData>>();
        var data = new PredictionsData(options.Object, logger.Object);

        try
        {
            Assert.False(Directory.Exists(directory));

            await data.InitializeAsync();

            Assert.True(Directory.Exists(directory));
        }
        finally
        {
            CleanupFile(tempPath);
            if (Directory.Exists(directory))
                Directory.Delete(directory, recursive: true);
        }
    }

    [Fact]
    public async Task InitializeAsync_InMemoryConnectionString_DoesNotThrow()
    {
        var options = new Mock<IOptions<DatabaseOptions>>();
        options.Setup(x => x.Value).Returns(new DatabaseOptions
        {
            ConnectionString = "Data Source=:memory:"
        });
        var logger = new Mock<ILogger<PredictionsData>>();
        var data = new PredictionsData(options.Object, logger.Object);

        await data.InitializeAsync();
    }

    [Fact]
    public async Task PublishAsync_ReturnsFalse_WhenNotFound()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var published = await data.PublishAsync(2024, 5);

            Assert.False(published);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task PublishAsync_SetsPublishedFlag()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));
            var published = await data.PublishAsync(2024, 5);

            Assert.True(published);

            var summaries = (await data.GetAllSummariesAsync()).ToList();
            Assert.True(summaries.Single(s => s.Season == 2024 && s.Week == 5).IsPublished);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task PublishGradedResultsAsync_GradedAndPicksPublished_SetsResultsPublishedTrue()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));
            await data.PublishAsync(2024, 5);
            await data.SaveGradedResultAsync(CreatePredictionsResult(2024, 5));

            var published = await data.PublishGradedResultsAsync(2024, 5);

            Assert.True(published);
            Assert.True(await data.AreResultsPublishedAsync(2024, 5));
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task PublishGradedResultsAsync_NoRow_ReturnsFalse()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var published = await data.PublishGradedResultsAsync(2024, 5);

            Assert.False(published);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task PublishGradedResultsAsync_NotGraded_ReturnsFalse()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));
            await data.PublishAsync(2024, 5);

            var published = await data.PublishGradedResultsAsync(2024, 5);

            Assert.False(published);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task PublishGradedResultsAsync_PicksNotPublished_ReturnsFalse()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));
            await data.SaveGradedResultAsync(CreatePredictionsResult(2024, 5));

            var published = await data.PublishGradedResultsAsync(2024, 5);

            Assert.False(published);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveAsync_AndGetAsync_RoundTrips()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var predictions = CreatePredictionsResult(2024, 5);
            await data.SaveAsync(predictions);

            var result = await data.GetAsync(2024, 5);

            Assert.NotNull(result);
            Assert.Equal(2024, result.Season);
            Assert.Equal(5, result.Week);
            Assert.Single(result.Predictions);
            Assert.Equal("Ohio State", result.Predictions.First().PredictedWinner);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveAsync_OverwritingGradedRow_ResetsGradedAndResultsPublished()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));
            await data.PublishAsync(2024, 5);
            await data.SaveGradedResultAsync(CreatePredictionsResult(2024, 5));
            await data.PublishGradedResultsAsync(2024, 5);

            await data.SaveAsync(CreatePredictionsResult(2024, 5));

            var summaries = (await data.GetAllSummariesAsync()).ToList();
            var summary = summaries.Single(s => s.Season == 2024 && s.Week == 5);

            Assert.False(summary.IsGraded);
            Assert.False(summary.ResultsPublished);
            Assert.Null(summary.GradedAt);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveAsync_ReplacesExistingPredictions()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var original = CreatePredictionsResult(2024, 5, "Texas", "Oklahoma");
            await data.SaveAsync(original);

            var replacement = CreatePredictionsResult(2024, 5, "Michigan", "Iowa");
            await data.SaveAsync(replacement);

            var result = await data.GetAsync(2024, 5);

            Assert.NotNull(result);
            Assert.Equal("Michigan", result.Predictions.First().HomeTeam);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveAsync_ResetsPublishedFlag()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));
            await data.PublishAsync(2024, 5);

            await data.SaveAsync(CreatePredictionsResult(2024, 5));

            var summaries = (await data.GetAllSummariesAsync()).ToList();
            var summary = summaries.Single(s => s.Season == 2024 && s.Week == 5);
            Assert.False(summary.IsPublished);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveAsync_ThrowsOnNullPredictions()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();
            await Assert.ThrowsAsync<ArgumentNullException>(() => data.SaveAsync(null!));
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveGradedResultAsync_NoExistingRow_ReturnsFalse()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            var saved = await data.SaveGradedResultAsync(CreatePredictionsResult(2024, 5));

            Assert.False(saved);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveGradedResultAsync_ThrowsOnNullPredictions()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();
            await Assert.ThrowsAsync<ArgumentNullException>(() => data.SaveGradedResultAsync(null!));
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveGradedResultAsync_UpdatesJsonAndGradedWithoutTouchingPublished()
    {
        var (data, tempPath) = CreatePredictionsDataWithFile();
        try
        {
            await data.InitializeAsync();

            await data.SaveAsync(CreatePredictionsResult(2024, 5));

            var graded = CreatePredictionsResult(2024, 5);
            graded.Predictions[0].WinnerGrade = PredictionGradeStatus.Correct;

            var saved = await data.SaveGradedResultAsync(graded);

            Assert.True(saved);

            var result = await data.GetAsync(2024, 5);
            Assert.NotNull(result);
            Assert.Equal(PredictionGradeStatus.Correct, result.Predictions.First().WinnerGrade);

            var summaries = (await data.GetAllSummariesAsync()).ToList();
            var summary = summaries.Single(s => s.Season == 2024 && s.Week == 5);
            Assert.True(summary.IsGraded);
            Assert.NotNull(summary.GradedAt);
            Assert.False(summary.IsPublished);
            Assert.False(summary.ResultsPublished);
        }
        finally
        {
            CleanupFile(tempPath);
        }
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

    private static (PredictionsData data, string filePath) CreatePredictionsDataWithFile()
    {
        var tempPath = Path.Combine(Path.GetTempPath(), $"cfbpoll_pred_test_{Guid.NewGuid()}.db");

        var options = new Mock<IOptions<DatabaseOptions>>();
        options.Setup(x => x.Value).Returns(new DatabaseOptions
        {
            ConnectionString = $"Data Source={tempPath};Pooling=false"
        });

        var logger = new Mock<ILogger<PredictionsData>>();
        return (new PredictionsData(options.Object, logger.Object), tempPath);
    }

    private static PredictionsResult CreatePredictionsResult(
        int season, int week, string homeTeam = "Ohio State", string awayTeam = "Michigan")
    {
        return new PredictionsResult
        {
            Season = season,
            Week = week,
            Predictions =
            [
                new GamePrediction
                {
                    AwayTeam = awayTeam,
                    AwayTeamScore = 17,
                    HomeTeam = homeTeam,
                    HomeTeamScore = 28,
                    NeutralSite = false,
                    PredictedMargin = 10.5,
                    PredictedWinner = homeTeam
                }
            ]
        };
    }
}
