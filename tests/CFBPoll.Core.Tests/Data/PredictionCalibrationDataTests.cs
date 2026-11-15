using CFBPoll.Core.Data;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Data;

public class PredictionCalibrationDataTests
{
    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        var options = new Mock<IOptions<DatabaseOptions>>();
        options.Setup(x => x.Value).Returns(new DatabaseOptions { ConnectionString = "Data Source=:memory:" });

        Assert.Throws<ArgumentNullException>(() => new PredictionCalibrationData(options.Object, null!));
    }

    [Fact]
    public void Constructor_NullOptions_ThrowsArgumentNullException()
    {
        var logger = new Mock<ILogger<PredictionCalibrationData>>();

        Assert.Throws<ArgumentNullException>(() => new PredictionCalibrationData(null!, logger.Object));
    }

    [Fact]
    public async Task GetAsync_NoRow_ReturnsNull()
    {
        var (data, tempPath) = CreateDataWithFile();
        try
        {
            await data.InitializeAsync();

            var result = await data.GetAsync(2025, 3);

            Assert.Null(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetAsync_SavedRow_RoundTripsValuesSourceAndUtcTimestamp()
    {
        var (data, tempPath) = CreateDataWithFile();
        try
        {
            await data.InitializeAsync();
            await data.SaveAsync(CreateCalibration(2025, 3, PredictionCalibrationSource.Accepted, ("paramA", 1.25), ("paramB", -3)));

            var result = await data.GetAsync(2025, 3);

            Assert.NotNull(result);
            Assert.Equal(2025, result.Season);
            Assert.Equal(3, result.Week);
            Assert.Equal(PredictionCalibrationSource.Accepted, result.Source);
            Assert.Equal(1.25, result.Values["paramA"]);
            Assert.Equal(-3, result.Values["paramB"]);
            Assert.Equal(DateTimeKind.Utc, result.UpdatedAt!.Value.Kind);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetLatestBeforeAsync_EarlierWeekSameSeason_ReturnsLatestEarlierWeek()
    {
        var (data, tempPath) = CreateDataWithFile();
        try
        {
            await data.InitializeAsync();
            await data.SaveAsync(CreateCalibration(2025, 2, PredictionCalibrationSource.Manual, ("paramA", 1)));
            await data.SaveAsync(CreateCalibration(2025, 4, PredictionCalibrationSource.Manual, ("paramA", 2)));
            await data.SaveAsync(CreateCalibration(2025, 7, PredictionCalibrationSource.Manual, ("paramA", 3)));

            var result = await data.GetLatestBeforeAsync(2025, 6);

            Assert.NotNull(result);
            Assert.Equal(4, result.Week);
            Assert.Equal(2, result.Values["paramA"]);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetLatestBeforeAsync_NoEarlierRow_ReturnsNull()
    {
        var (data, tempPath) = CreateDataWithFile();
        try
        {
            await data.InitializeAsync();
            await data.SaveAsync(CreateCalibration(2025, 5, PredictionCalibrationSource.Manual, ("paramA", 1)));

            var result = await data.GetLatestBeforeAsync(2025, 5);

            Assert.Null(result);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetLatestBeforeAsync_OnlyPriorSeason_ReturnsPriorSeasonsLastWeek()
    {
        var (data, tempPath) = CreateDataWithFile();
        try
        {
            await data.InitializeAsync();
            await data.SaveAsync(CreateCalibration(2024, 9, PredictionCalibrationSource.Manual, ("paramA", 1)));
            await data.SaveAsync(CreateCalibration(2024, 15, PredictionCalibrationSource.Manual, ("paramA", 4)));

            var result = await data.GetLatestBeforeAsync(2025, 1);

            Assert.NotNull(result);
            Assert.Equal(2024, result.Season);
            Assert.Equal(15, result.Week);
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task GetSeasonAsync_MultipleSeasons_ReturnsOnlyThatSeasonInWeekOrder()
    {
        var (data, tempPath) = CreateDataWithFile();
        try
        {
            await data.InitializeAsync();
            await data.SaveAsync(CreateCalibration(2025, 6, PredictionCalibrationSource.Manual, ("paramA", 1)));
            await data.SaveAsync(CreateCalibration(2024, 3, PredictionCalibrationSource.Manual, ("paramA", 1)));
            await data.SaveAsync(CreateCalibration(2025, 2, PredictionCalibrationSource.Manual, ("paramA", 1)));

            var result = (await data.GetSeasonAsync(2025)).ToList();

            Assert.Equal([2, 6], result.Select(r => r.Week));
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveAsync_ExistingRow_ReplacesIt()
    {
        var (data, tempPath) = CreateDataWithFile();
        try
        {
            await data.InitializeAsync();
            await data.SaveAsync(CreateCalibration(2025, 3, PredictionCalibrationSource.CarriedForward, ("paramA", 1)));

            await data.SaveAsync(CreateCalibration(2025, 3, PredictionCalibrationSource.Manual, ("paramA", 2.5)));
            var result = await data.GetAsync(2025, 3);

            Assert.Equal(PredictionCalibrationSource.Manual, result!.Source);
            Assert.Equal(2.5, result.Values["paramA"]);
            Assert.Single(await data.GetSeasonAsync(2025));
        }
        finally
        {
            CleanupFile(tempPath);
        }
    }

    [Fact]
    public async Task SaveAsync_NullCalibration_ThrowsArgumentNullException()
    {
        var (data, tempPath) = CreateDataWithFile();
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

    private static PredictionCalibration CreateCalibration(int season, int week, PredictionCalibrationSource source, params (string Key, double Value)[] values)
    {
        return new PredictionCalibration
        {
            Season = season,
            Source = source,
            Values = values.ToDictionary(v => v.Key, v => v.Value),
            Week = week
        };
    }

    private static (PredictionCalibrationData data, string filePath) CreateDataWithFile()
    {
        var tempPath = Path.Combine(Path.GetTempPath(), $"cfbpoll_calibration_test_{Guid.NewGuid()}.db");

        var options = new Mock<IOptions<DatabaseOptions>>();
        options.Setup(x => x.Value).Returns(new DatabaseOptions
        {
            ConnectionString = $"Data Source={tempPath};Pooling=false"
        });

        var logger = new Mock<ILogger<PredictionCalibrationData>>();
        return (new PredictionCalibrationData(options.Object, logger.Object), tempPath);
    }
}
