using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class AdminModuleTests
{
    private readonly Mock<IPersistentCache> _mockCache;
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<IExcelExportModule> _mockExcelExportModule;
    private readonly Mock<ILogger<AdminModule>> _mockLogger;
    private readonly Mock<IPollLeadersModule> _mockPollLeadersModule;
    private readonly Mock<IPredictionCalculatorModule> _mockPredictionCalculatorModule;
    private readonly Mock<IPredictionsModule> _mockPredictionsModule;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<IRatingModule> _mockRatingModule;
    private readonly Mock<ISeasonTrendsModule> _mockSeasonTrendsModule;
    private readonly AdminModule _adminModule;

    public AdminModuleTests()
    {
        _mockCache = new Mock<IPersistentCache>();
        _mockDataService = new Mock<ICFBDataService>();
        _mockExcelExportModule = new Mock<IExcelExportModule>();
        _mockLogger = new Mock<ILogger<AdminModule>>();
        _mockPollLeadersModule = new Mock<IPollLeadersModule>();
        _mockPredictionCalculatorModule = new Mock<IPredictionCalculatorModule>();
        _mockPredictionsModule = new Mock<IPredictionsModule>();
        _mockRankingsModule = new Mock<IRankingsModule>();
        _mockRatingModule = new Mock<IRatingModule>();
        _mockSeasonTrendsModule = new Mock<ISeasonTrendsModule>();

        _mockDataService.Setup(x => x.GetBettingLinesAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(new List<BettingLine>());

        _adminModule = new AdminModule(
            _mockDataService.Object,
            _mockExcelExportModule.Object,
            _mockCache.Object,
            _mockPollLeadersModule.Object,
            _mockPredictionCalculatorModule.Object,
            _mockPredictionsModule.Object,
            _mockRankingsModule.Object,
            _mockRatingModule.Object,
            _mockSeasonTrendsModule.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task CalculateRankingsAsync_CallsServicesInOrder()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        var result = await _adminModule.CalculateRankingsAsync(2024, 5);

        Assert.NotNull(result);
        Assert.Equal(2024, result.Rankings.Season);
        Assert.Equal(5, result.Rankings.Week);
        Assert.True(result.IsPersisted);
        _mockRankingsModule.Verify(x => x.SaveSnapshotAsync(rankings), Times.Once);
    }

    [Fact]
    public async Task CalculateRankingsAsync_ClearsComponentCachesBeforeFetching()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        var callOrder = new List<string>();
        _mockCache.Setup(x => x.RemoveAsync(It.IsAny<string>()))
            .Callback<string>(key => callOrder.Add($"cache_remove:{key}"))
            .ReturnsAsync(true);
        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5))
            .Callback(() => callOrder.Add("get_season_data"))
            .ReturnsAsync(seasonData);

        await _adminModule.CalculateRankingsAsync(2024, 5);

        _mockCache.Verify(x => x.RemoveAsync("advancedGameStats_2024_postseason"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("advancedGameStats_2024_regular"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("bettingLines_2024_1"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("bettingLines_2024_6"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("games_2024_postseason"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("games_2024_regular"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("seasonStats_2024"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("seasonStats_2024_week_5"), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync("teams_2024"), Times.Once);

        Assert.True(callOrder.IndexOf("get_season_data") > callOrder.IndexOf("cache_remove:teams_2024"));
    }

    [Fact]
    public async Task CalculateRankingsAsync_PersistFailure_SetsPersistedFalse()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);
        _mockRankingsModule.Setup(x => x.SaveSnapshotAsync(It.IsAny<RankingsResult>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        var result = await _adminModule.CalculateRankingsAsync(2024, 5);

        Assert.False(result.IsPersisted);
    }

    [Fact]
    public async Task PublishSnapshotAsync_DelegatesToRankingsModule()
    {
        _mockRankingsModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.PublishSnapshotAsync(2024, 5);

        Assert.True(result);
        _mockRankingsModule.Verify(x => x.PublishSnapshotAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task DeleteSnapshotAsync_DelegatesToRankingsModule()
    {
        _mockRankingsModule.Setup(x => x.DeleteSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.DeleteSnapshotAsync(2024, 5);

        Assert.True(result);
        _mockRankingsModule.Verify(x => x.DeleteSnapshotAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task GetSnapshotsAsync_DelegatesToRankingsModule()
    {
        var weeks = new List<SnapshotSummary>
        {
            new SnapshotSummary { Season = 2024, Week = 1, IsPublished = true }
        };

        _mockRankingsModule.Setup(x => x.GetSnapshotsAsync()).ReturnsAsync(weeks);

        var result = await _adminModule.GetSnapshotsAsync();

        Assert.Single(result);
        _mockRankingsModule.Verify(x => x.GetSnapshotsAsync(), Times.Once);
    }

    [Fact]
    public async Task ExportRankingsAsync_SnapshotExists_ReturnsBytes()
    {
        var snapshot = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        var expectedBytes = new byte[] { 1, 2, 3 };

        _mockRankingsModule.Setup(x => x.GetSnapshotAsync(2024, 5)).ReturnsAsync(snapshot);
        _mockExcelExportModule.Setup(x => x.GenerateRankingsWorkbook(snapshot)).Returns(expectedBytes);

        var result = await _adminModule.ExportRankingsAsync(2024, 5);

        Assert.Equal(expectedBytes, result);
    }

    [Fact]
    public async Task ExportRankingsAsync_NoSnapshot_ReturnsNull()
    {
        _mockRankingsModule.Setup(x => x.GetSnapshotAsync(2024, 5)).ReturnsAsync((RankingsResult?)null);

        var result = await _adminModule.ExportRankingsAsync(2024, 5);

        Assert.Null(result);
        _mockExcelExportModule.Verify(x => x.GenerateRankingsWorkbook(It.IsAny<RankingsResult>()), Times.Never);
    }

    [Fact]
    public async Task CalculateRankingsAsync_GetSeasonDataAsyncThrows_PropagatesException()
    {
        _mockDataService
            .Setup(x => x.GetSeasonDataAsync(2024, 5))
            .ThrowsAsync(new InvalidOperationException("API unavailable"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminModule.CalculateRankingsAsync(2024, 5));
    }

    [Fact]
    public async Task CalculateRankingsAsync_RateTeamsAsyncThrows_PropagatesException()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule
            .Setup(x => x.RateTeamsAsync(seasonData))
            .ThrowsAsync(new InvalidOperationException("Rating calculation failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminModule.CalculateRankingsAsync(2024, 5));
    }

    [Fact]
    public async Task CalculateRankingsAsync_GenerateRankingsAsyncThrows_PropagatesException()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule
            .Setup(x => x.GenerateRankingsAsync(seasonData, ratings))
            .ThrowsAsync(new InvalidOperationException("Rankings generation failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminModule.CalculateRankingsAsync(2024, 5));
    }

    [Fact]
    public async Task CalculateRankingsAsync_Success_InvalidatesPollLeadersCache()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        await _adminModule.CalculateRankingsAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task CalculateRankingsAsync_Success_InvalidatesSeasonTrendsCache()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);

        await _adminModule.CalculateRankingsAsync(2024, 5);

        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task CalculateRankingsAsync_PersistFailure_DoesNotInvalidatePollLeadersCache()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockRankingsModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings)).ReturnsAsync(rankings);
        _mockRankingsModule.Setup(x => x.SaveSnapshotAsync(It.IsAny<RankingsResult>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        await _adminModule.CalculateRankingsAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task DeleteSnapshotAsync_Success_InvalidatesPollLeadersCache()
    {
        _mockRankingsModule.Setup(x => x.DeleteSnapshotAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.DeleteSnapshotAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteSnapshotAsync_Success_InvalidatesSeasonTrendsCache()
    {
        _mockRankingsModule.Setup(x => x.DeleteSnapshotAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.DeleteSnapshotAsync(2024, 5);

        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteSnapshotAsync_Failure_DoesNotInvalidatePollLeadersCache()
    {
        _mockRankingsModule.Setup(x => x.DeleteSnapshotAsync(2024, 5)).ReturnsAsync(false);

        await _adminModule.DeleteSnapshotAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task PublishSnapshotAsync_Success_InvalidatesPollLeadersCache()
    {
        _mockRankingsModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.PublishSnapshotAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task PublishSnapshotAsync_Success_InvalidatesSeasonTrendsCache()
    {
        _mockRankingsModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(true);

        await _adminModule.PublishSnapshotAsync(2024, 5);

        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Once);
    }

    [Fact]
    public async Task PublishSnapshotAsync_Failure_DoesNotInvalidatePollLeadersCache()
    {
        _mockRankingsModule.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(false);

        await _adminModule.PublishSnapshotAsync(2024, 5);

        _mockPollLeadersModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
        _mockSeasonTrendsModule.Verify(x => x.InvalidateCacheAsync(), Times.Never);
    }

    [Fact]
    public async Task PublishSnapshotAsync_RankingsModuleThrows_PropagatesException()
    {
        _mockRankingsModule
            .Setup(x => x.PublishSnapshotAsync(2024, 5))
            .ThrowsAsync(new InvalidOperationException("Publish failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminModule.PublishSnapshotAsync(2024, 5));
    }

    [Fact]
    public async Task DeleteSnapshotAsync_RankingsModuleThrows_PropagatesException()
    {
        _mockRankingsModule
            .Setup(x => x.DeleteSnapshotAsync(2024, 5))
            .ThrowsAsync(new InvalidOperationException("Delete failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _adminModule.DeleteSnapshotAsync(2024, 5));
    }

    [Fact]
    public async Task CalculatePredictionsAsync_CallsServicesInOrder()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Texas"] = new(),
            ["Oklahoma"] = new(),
            ["Ohio State"] = new(),
            ["Michigan"] = new(),
            ["Alabama"] = new(),
            ["Florida"] = new()
        };
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Texas"] = new() { Rating = 90 },
            ["Oklahoma"] = new() { Rating = 80 }
        };
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Texas", AwayTeam = "Oklahoma" },
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Ohio State", AwayTeam = "Michigan" },
            new() { Week = 5, SeasonType = "regular", HomeTeam = "Alabama", AwayTeam = "Florida" }
        };
        var predictions = new List<GamePrediction>
        {
            new() { HomeTeam = "Texas", AwayTeam = "Oklahoma", PredictedWinner = "Texas" }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.Is<IEnumerable<ScheduleGame>>(g => g.Count() == 2), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(predictions);

        var result = await _adminModule.CalculatePredictionsAsync(2024, 5);

        Assert.NotNull(result);
        Assert.True(result.IsPersisted);
        Assert.Equal(2024, result.Predictions.Season);
        Assert.Equal(5, result.Predictions.Week);
        Assert.Single(result.Predictions.Predictions);
        _mockPredictionsModule.Verify(x => x.SaveAsync(It.IsAny<PredictionsResult>()), Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_UsesSelectedWeekForSeasonData()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 8, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 8)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculatePredictionsAsync(2024, 8);

        _mockDataService.Verify(x => x.GetSeasonDataAsync(2024, 8), Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_FiltersGamesToNextWeekAndFBSOnly()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Nebraska"] = new(),
            ["Iowa"] = new(),
            ["USC"] = new(),
            ["Notre Dame"] = new(),
            ["Alabama"] = new(),
            ["Florida"] = new()
        };
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Nebraska", AwayTeam = "Iowa" },
            new() { Week = 6, SeasonType = "regular", HomeTeam = "USC", AwayTeam = "Notre Dame" },
            new() { Week = 5, SeasonType = "regular", HomeTeam = "Alabama", AwayTeam = "Florida" },
            new() { Week = 7, SeasonType = "regular", HomeTeam = "Alabama", AwayTeam = "Florida" }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculatePredictionsAsync(2024, 5);

        _mockPredictionCalculatorModule.Verify(x =>
            x.GeneratePredictionsAsync(seasonData, ratings,
                It.Is<IEnumerable<ScheduleGame>>(g =>
                    g.Count() == 2),
                It.IsAny<IEnumerable<BettingLine>>()),
            Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_ExcludesNonFBSGames()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Ohio State"] = new(),
            ["Michigan"] = new()
        };
        var seasonData = new SeasonData { Season = 2024, Week = 4, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 5, SeasonType = "regular", HomeTeam = "Ohio State", AwayTeam = "Michigan" },
            new() { Week = 5, SeasonType = "regular", HomeTeam = "Ohio State", AwayTeam = "Youngstown State" },
            new() { Week = 5, SeasonType = "regular", HomeTeam = "North Dakota State", AwayTeam = "Michigan" }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 4)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculatePredictionsAsync(2024, 4);

        _mockPredictionCalculatorModule.Verify(x =>
            x.GeneratePredictionsAsync(seasonData, ratings,
                It.Is<IEnumerable<ScheduleGame>>(g =>
                    g.Count() == 1 && g.First().HomeTeam == "Ohio State" && g.First().AwayTeam == "Michigan"),
                It.IsAny<IEnumerable<BettingLine>>()),
            Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_PostseasonWeek_IncludesAllPostseasonGames()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Texas"] = new(),
            ["Oklahoma"] = new(),
            ["Ohio State"] = new(),
            ["Michigan"] = new()
        };
        var seasonData = new SeasonData { Season = 2024, Week = 15, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 14, SeasonType = "regular", HomeTeam = "Texas", AwayTeam = "Oklahoma" },
            new() { Week = 1, SeasonType = "postseason", HomeTeam = "Ohio State", AwayTeam = "Michigan" },
            new() { Week = 1, SeasonType = "postseason", HomeTeam = "Texas", AwayTeam = "Oklahoma" }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 15)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculatePredictionsAsync(2024, 15);

        _mockPredictionCalculatorModule.Verify(x =>
            x.GeneratePredictionsAsync(seasonData, ratings,
                It.Is<IEnumerable<ScheduleGame>>(g =>
                    g.Count() == 2 && g.All(game => game.SeasonType == "postseason")),
                It.IsAny<IEnumerable<BettingLine>>()),
            Times.Once);
        _mockDataService.Verify(x => x.GetBettingLinesAsync(2024, 1), Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_RegularSeason_FetchesBettingLinesForNextWeek()
    {
        var fbsTeams = new Dictionary<string, TeamInfo>
        {
            ["Nebraska"] = new(),
            ["Iowa"] = new()
        };
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = fbsTeams };
        var ratings = new Dictionary<string, RatingDetails>();
        var schedule = new List<ScheduleGame>
        {
            new() { Week = 6, SeasonType = "regular", HomeTeam = "Nebraska", AwayTeam = "Iowa" }
        };

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(schedule);
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());

        await _adminModule.CalculatePredictionsAsync(2024, 5);

        _mockDataService.Verify(x => x.GetBettingLinesAsync(2024, 6), Times.Once);
    }

    [Fact]
    public async Task CalculatePredictionsAsync_PersistFailure_SetsIsPersistedFalse()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        _mockDataService.Setup(x => x.GetSeasonDataAsync(2024, 5)).ReturnsAsync(seasonData);
        _mockRatingModule.Setup(x => x.RateTeamsAsync(seasonData)).ReturnsAsync(ratings);
        _mockDataService.Setup(x => x.GetFullSeasonScheduleAsync(2024)).ReturnsAsync(new List<ScheduleGame>());
        _mockPredictionCalculatorModule
            .Setup(x => x.GeneratePredictionsAsync(seasonData, ratings, It.IsAny<IEnumerable<ScheduleGame>>(), It.IsAny<IEnumerable<BettingLine>>()))
            .ReturnsAsync(new List<GamePrediction>());
        _mockPredictionsModule.Setup(x => x.SaveAsync(It.IsAny<PredictionsResult>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        var result = await _adminModule.CalculatePredictionsAsync(2024, 5);

        Assert.False(result.IsPersisted);
    }

    [Fact]
    public async Task DeletePredictionsAsync_DelegatesToPredictionsModule()
    {
        _mockPredictionsModule.Setup(x => x.DeleteAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.DeletePredictionsAsync(2024, 5);

        Assert.True(result);
        _mockPredictionsModule.Verify(x => x.DeleteAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task GetPredictionsSummariesAsync_DelegatesToPredictionsModule()
    {
        var summaries = new List<PredictionsSummary>
        {
            new() { Season = 2024, Week = 1, IsPublished = true, GameCount = 10 }
        };
        _mockPredictionsModule.Setup(x => x.GetAllSummariesAsync()).ReturnsAsync(summaries);

        var result = await _adminModule.GetPredictionsSummariesAsync();

        Assert.Single(result);
        _mockPredictionsModule.Verify(x => x.GetAllSummariesAsync(), Times.Once);
    }

    [Fact]
    public async Task PublishPredictionsAsync_DelegatesToPredictionsModule()
    {
        _mockPredictionsModule.Setup(x => x.PublishAsync(2024, 5)).ReturnsAsync(true);

        var result = await _adminModule.PublishPredictionsAsync(2024, 5);

        Assert.True(result);
        _mockPredictionsModule.Verify(x => x.PublishAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task ExportRankingsAsync_SnapshotExists_CallsGetSnapshotThenGenerateWorkbook()
    {
        var snapshot = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        var expectedBytes = new byte[] { 1, 2, 3 };
        var callOrder = new List<string>();

        _mockRankingsModule.Setup(x => x.GetSnapshotAsync(2024, 5))
            .Callback(() => callOrder.Add("get_snapshot"))
            .ReturnsAsync(snapshot);
        _mockExcelExportModule.Setup(x => x.GenerateRankingsWorkbook(snapshot))
            .Callback(() => callOrder.Add("generate_workbook"))
            .Returns(expectedBytes);

        await _adminModule.ExportRankingsAsync(2024, 5);

        Assert.Equal(2, callOrder.Count);
        Assert.True(callOrder.IndexOf("get_snapshot") < callOrder.IndexOf("generate_workbook"));
    }
}
