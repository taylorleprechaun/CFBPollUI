using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class CachingRankingsModuleTests
{
    private readonly Mock<IRankingsModule> _mockInnerModule;
    private readonly Mock<IPersistentCache> _mockCache;
    private readonly Mock<IOptions<CacheOptions>> _mockOptions;
    private readonly Mock<ILogger<CachingRankingsModule>> _mockLogger;
    private readonly CachingRankingsModule _module;

    public CachingRankingsModuleTests()
    {
        _mockInnerModule = new Mock<IRankingsModule>();
        _mockCache = new Mock<IPersistentCache>();
        _mockOptions = new Mock<IOptions<CacheOptions>>();
        _mockLogger = new Mock<ILogger<CachingRankingsModule>>();

        _mockOptions.Setup(x => x.Value).Returns(new CacheOptions
        {
            RankingsExpirationHours = 144
        });

        _module = new CachingRankingsModule(
            _mockInnerModule.Object,
            _mockCache.Object,
            _mockOptions.Object,
            _mockLogger.Object);
    }

    [Fact]
    public void Constructor_ThrowsOnNullInnerModule()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CachingRankingsModule(null!, _mockCache.Object, _mockOptions.Object, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullCache()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CachingRankingsModule(_mockInnerModule.Object, null!, _mockOptions.Object, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullOptions()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CachingRankingsModule(_mockInnerModule.Object, _mockCache.Object, null!, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_ThrowsOnNullLogger()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new CachingRankingsModule(_mockInnerModule.Object, _mockCache.Object, _mockOptions.Object, null!));
    }

    [Fact]
    public async Task GenerateRankingsAsync_ReturnsCachedData_WhenCacheHit()
    {
        var seasonData = CreateSeasonData(2024, 5);
        var ratings = new Dictionary<string, RatingDetails>();
        var cachedResult = CreateRankingsResult(2024, 5);

        _mockCache.Setup(x => x.GetAsync<RankingsResult>("rankings_2024_week_5"))
            .ReturnsAsync(cachedResult);

        var result = await _module.GenerateRankingsAsync(seasonData, ratings);

        Assert.Equal(2024, result.Season);
        Assert.Equal(5, result.Week);
        _mockInnerModule.Verify(
            x => x.GenerateRankingsAsync(It.IsAny<SeasonData>(), It.IsAny<IDictionary<string, RatingDetails>>()),
            Times.Never);
    }

    [Fact]
    public async Task GenerateRankingsAsync_CallsInnerModule_WhenCacheMiss()
    {
        var seasonData = CreateSeasonData(2024, 5);
        var ratings = new Dictionary<string, RatingDetails>();
        var generatedResult = CreateRankingsResult(2024, 5);

        _mockCache.Setup(x => x.GetAsync<RankingsResult>("rankings_2024_week_5"))
            .ReturnsAsync((RankingsResult?)null);
        _mockInnerModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings))
            .ReturnsAsync(generatedResult);

        var result = await _module.GenerateRankingsAsync(seasonData, ratings);

        Assert.Equal(2024, result.Season);
        _mockInnerModule.Verify(x => x.GenerateRankingsAsync(seasonData, ratings), Times.Once);
        _mockCache.Verify(x => x.SetAsync("rankings_2024_week_5", It.IsAny<RankingsResult>(), It.IsAny<DateTime>()), Times.Once);
    }

    [Fact]
    public async Task GenerateRankingsAsync_UsesDifferentCacheKeys_ForDifferentWeeks()
    {
        var seasonData1 = CreateSeasonData(2024, 1);
        var seasonData2 = CreateSeasonData(2024, 5);
        var ratings = new Dictionary<string, RatingDetails>();

        _mockCache.Setup(x => x.GetAsync<RankingsResult>(It.IsAny<string>()))
            .ReturnsAsync((RankingsResult?)null);
        _mockInnerModule.Setup(x => x.GenerateRankingsAsync(It.IsAny<SeasonData>(), It.IsAny<IDictionary<string, RatingDetails>>()))
            .ReturnsAsync((SeasonData sd, IDictionary<string, RatingDetails> _) => CreateRankingsResult(sd.Season, sd.Week));

        await _module.GenerateRankingsAsync(seasonData1, ratings);
        await _module.GenerateRankingsAsync(seasonData2, ratings);

        _mockCache.Verify(x => x.GetAsync<RankingsResult>("rankings_2024_week_1"), Times.Once);
        _mockCache.Verify(x => x.GetAsync<RankingsResult>("rankings_2024_week_5"), Times.Once);
    }

    [Fact]
    public async Task GenerateRankingsAsync_UsesDifferentCacheKeys_ForDifferentSeasons()
    {
        var seasonData1 = CreateSeasonData(2023, 5);
        var seasonData2 = CreateSeasonData(2024, 5);
        var ratings = new Dictionary<string, RatingDetails>();

        _mockCache.Setup(x => x.GetAsync<RankingsResult>(It.IsAny<string>()))
            .ReturnsAsync((RankingsResult?)null);
        _mockInnerModule.Setup(x => x.GenerateRankingsAsync(It.IsAny<SeasonData>(), It.IsAny<IDictionary<string, RatingDetails>>()))
            .ReturnsAsync((SeasonData sd, IDictionary<string, RatingDetails> _) => CreateRankingsResult(sd.Season, sd.Week));

        await _module.GenerateRankingsAsync(seasonData1, ratings);
        await _module.GenerateRankingsAsync(seasonData2, ratings);

        _mockCache.Verify(x => x.GetAsync<RankingsResult>("rankings_2023_week_5"), Times.Once);
        _mockCache.Verify(x => x.GetAsync<RankingsResult>("rankings_2024_week_5"), Times.Once);
    }

    [Fact]
    public async Task GenerateRankingsAsync_UsesNeverExpire_ForPastSeasons()
    {
        var pastSeason = DateTime.Now.Year - 1;
        var seasonData = CreateSeasonData(pastSeason, 5);
        var ratings = new Dictionary<string, RatingDetails>();

        _mockCache.Setup(x => x.GetAsync<RankingsResult>($"rankings_{pastSeason}_week_5"))
            .ReturnsAsync((RankingsResult?)null);
        _mockInnerModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings))
            .ReturnsAsync(CreateRankingsResult(pastSeason, 5));

        DateTime capturedExpiration = default;
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<RankingsResult>(), It.IsAny<DateTime>()))
            .Callback<string, RankingsResult, DateTime>((_, _, exp) => capturedExpiration = exp)
            .ReturnsAsync(true);

        await _module.GenerateRankingsAsync(seasonData, ratings);

        Assert.Equal(DateTime.MaxValue, capturedExpiration);
    }

    [Fact]
    public async Task GenerateRankingsAsync_UsesConfiguredExpiration_ForCurrentSeason()
    {
        var currentSeason = DateTime.Now.Year;
        var seasonData = CreateSeasonData(currentSeason, 5);
        var ratings = new Dictionary<string, RatingDetails>();

        _mockCache.Setup(x => x.GetAsync<RankingsResult>($"rankings_{currentSeason}_week_5"))
            .ReturnsAsync((RankingsResult?)null);
        _mockInnerModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings))
            .ReturnsAsync(CreateRankingsResult(currentSeason, 5));

        DateTime capturedExpiration = default;
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<RankingsResult>(), It.IsAny<DateTime>()))
            .Callback<string, RankingsResult, DateTime>((_, _, exp) => capturedExpiration = exp)
            .ReturnsAsync(true);

        await _module.GenerateRankingsAsync(seasonData, ratings);

        var hoursUntilExpiration = (capturedExpiration - DateTime.UtcNow).TotalHours;
        Assert.True(hoursUntilExpiration <= 144);
        Assert.True(hoursUntilExpiration > 0);
    }

    [Fact]
    public async Task GenerateRankingsAsync_CachesResult_WithCorrectData()
    {
        var seasonData = CreateSeasonData(2024, 5);
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails { Rating = 90.0, Wins = 5, Losses = 1 }
        };
        var generatedResult = new RankingsResult
        {
            Season = 2024,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam { TeamName = "Team A", Rank = 1, Rating = 90.0 }
            }
        };

        _mockCache.Setup(x => x.GetAsync<RankingsResult>("rankings_2024_week_5"))
            .ReturnsAsync((RankingsResult?)null);
        _mockInnerModule.Setup(x => x.GenerateRankingsAsync(seasonData, ratings))
            .ReturnsAsync(generatedResult);

        RankingsResult? capturedResult = null;
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<RankingsResult>(), It.IsAny<DateTime>()))
            .Callback<string, RankingsResult, DateTime>((_, result, _) => capturedResult = result)
            .ReturnsAsync(true);

        await _module.GenerateRankingsAsync(seasonData, ratings);

        Assert.NotNull(capturedResult);
        Assert.Equal(2024, capturedResult.Season);
        Assert.Equal(5, capturedResult.Week);
        Assert.Single(capturedResult.Rankings);
        Assert.Equal("Team A", capturedResult.Rankings.First().TeamName);
    }

    [Fact]
    public async Task GenerateRankingsAsync_DoesNotCallInnerModule_WhenCacheHit()
    {
        var seasonData = CreateSeasonData(2024, 5);
        var ratings = new Dictionary<string, RatingDetails>();
        var cachedResult = CreateRankingsResult(2024, 5);

        _mockCache.Setup(x => x.GetAsync<RankingsResult>("rankings_2024_week_5"))
            .ReturnsAsync(cachedResult);

        await _module.GenerateRankingsAsync(seasonData, ratings);
        await _module.GenerateRankingsAsync(seasonData, ratings);
        await _module.GenerateRankingsAsync(seasonData, ratings);

        _mockInnerModule.Verify(
            x => x.GenerateRankingsAsync(It.IsAny<SeasonData>(), It.IsAny<IDictionary<string, RatingDetails>>()),
            Times.Never);
        _mockCache.Verify(x => x.GetAsync<RankingsResult>("rankings_2024_week_5"), Times.Exactly(3));
    }

    private static SeasonData CreateSeasonData(int season, int week)
    {
        return new SeasonData
        {
            Season = season,
            Week = week,
            Teams = new Dictionary<string, TeamInfo>()
        };
    }

    private static RankingsResult CreateRankingsResult(int season, int week)
    {
        return new RankingsResult
        {
            Season = season,
            Week = week,
            Rankings = new List<RankedTeam>()
        };
    }
}
