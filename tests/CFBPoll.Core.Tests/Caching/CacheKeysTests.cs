using CFBPoll.Core.Caching;
using Xunit;

namespace CFBPoll.Core.Tests.Caching;

public class CacheKeysTests
{
    [Fact]
    public void AdvancedGameStats_ReturnsExpectedFormat()
    {
        Assert.Equal("advancedGameStats_2024_regular", CacheKeys.AdvancedGameStats(2024, "regular"));
    }

    [Fact]
    public void BettingLines_ReturnsExpectedFormat()
    {
        Assert.Equal("bettingLines_2024_6", CacheKeys.BettingLines(2024, 6));
    }

    [Fact]
    public void Calendar_ReturnsExpectedFormat()
    {
        Assert.Equal("calendar_2024", CacheKeys.Calendar(2024));
    }

    [Fact]
    public void FullSchedule_ReturnsExpectedFormat()
    {
        Assert.Equal("fullSchedule_2024", CacheKeys.FullSchedule(2024));
    }

    [Fact]
    public void Games_ReturnsExpectedFormat()
    {
        Assert.Equal("games_2024_postseason", CacheKeys.Games(2024, "postseason"));
    }

    [Fact]
    public void GetSeasonScopedKeys_IncludesFullSchedule()
    {
        var keys = CacheKeys.GetSeasonScopedKeys(2024, 5);

        Assert.Contains("fullSchedule_2024", keys);
    }

    [Fact]
    public void GetSeasonScopedKeys_PostseasonBettingLinesWeek1_DoesNotDuplicateKey()
    {
        var keys = CacheKeys.GetSeasonScopedKeys(2024, 0).ToList();

        Assert.Single(keys, k => k == "bettingLines_2024_1");
    }

    [Fact]
    public void GetSeasonScopedKeys_RegularSeasonWeek_ReturnsExpectedKeys()
    {
        var keys = CacheKeys.GetSeasonScopedKeys(2024, 5).ToList();

        Assert.Contains("teams_2024", keys);
        Assert.Contains("fullSchedule_2024", keys);
        Assert.Contains("games_2024_regular", keys);
        Assert.Contains("games_2024_postseason", keys);
        Assert.Contains("advancedGameStats_2024_regular", keys);
        Assert.Contains("advancedGameStats_2024_postseason", keys);
        Assert.Contains("seasonStats_2024", keys);
        Assert.Contains("seasonStats_2024_week_5", keys);
        Assert.Contains("bettingLines_2024_6", keys);
    }

    [Fact]
    public void GetSeasonScopedKeys_RegularSeason_IncludesBettingLinesWeek1AndGameWeek()
    {
        var keys = CacheKeys.GetSeasonScopedKeys(2024, 5).ToList();

        Assert.Contains("bettingLines_2024_1", keys);
        Assert.Contains("bettingLines_2024_6", keys);
    }

    [Fact]
    public void SeasonStats_EndWeekNull_ReturnsSeasonScopedFormat()
    {
        Assert.Equal("seasonStats_2024", CacheKeys.SeasonStats(2024, null));
    }

    [Fact]
    public void SeasonStats_EndWeekProvided_ReturnsWeekScopedFormat()
    {
        Assert.Equal("seasonStats_2024_week_5", CacheKeys.SeasonStats(2024, 5));
    }

    [Fact]
    public void Teams_ReturnsExpectedFormat()
    {
        Assert.Equal("teams_2024", CacheKeys.Teams(2024));
    }
}
