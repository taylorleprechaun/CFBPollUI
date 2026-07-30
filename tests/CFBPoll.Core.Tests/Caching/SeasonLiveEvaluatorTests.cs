using CFBPoll.Core.Caching;
using CFBPoll.Core.Options;
using Xunit;

namespace CFBPoll.Core.Tests.Caching;

public class SeasonLiveEvaluatorTests
{
    [Fact]
    public void IsSeasonLive_AfterBoundary_ReturnsFalse()
    {
        var options = new CacheOptions { SeasonBoundaryGraceMonth = 3, SeasonBoundaryGraceDay = 1 };
        var utcNow = new DateTime(2026, 3, 15, 0, 0, 0, DateTimeKind.Utc);

        var result = SeasonLiveEvaluator.IsSeasonLive(2025, utcNow, options);

        Assert.False(result);
    }

    [Fact]
    public void IsSeasonLive_BeforeBoundary_ReturnsTrue()
    {
        var options = new CacheOptions { SeasonBoundaryGraceMonth = 3, SeasonBoundaryGraceDay = 1 };
        var utcNow = new DateTime(2026, 2, 15, 0, 0, 0, DateTimeKind.Utc);

        var result = SeasonLiveEvaluator.IsSeasonLive(2025, utcNow, options);

        Assert.True(result);
    }
    [Fact]
    public void IsSeasonLive_CurrentSeasonMidYear_ReturnsTrue()
    {
        var options = new CacheOptions { SeasonBoundaryGraceMonth = 3, SeasonBoundaryGraceDay = 1 };
        var utcNow = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);

        var result = SeasonLiveEvaluator.IsSeasonLive(2026, utcNow, options);

        Assert.True(result);
    }

    [Fact]
    public void IsSeasonLive_CustomGraceMonthDay_RespectsOptions()
    {
        var options = new CacheOptions { SeasonBoundaryGraceMonth = 6, SeasonBoundaryGraceDay = 15 };
        var beforeCustomBoundary = new DateTime(2026, 6, 14, 0, 0, 0, DateTimeKind.Utc);
        var afterCustomBoundary = new DateTime(2026, 6, 16, 0, 0, 0, DateTimeKind.Utc);

        Assert.True(SeasonLiveEvaluator.IsSeasonLive(2025, beforeCustomBoundary, options));
        Assert.False(SeasonLiveEvaluator.IsSeasonLive(2025, afterCustomBoundary, options));
    }

    [Fact]
    public void IsSeasonLive_ExactlyAtBoundary_ReturnsFalse()
    {
        var options = new CacheOptions { SeasonBoundaryGraceMonth = 3, SeasonBoundaryGraceDay = 1 };
        var utcNow = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc);

        var result = SeasonLiveEvaluator.IsSeasonLive(2025, utcNow, options);

        Assert.False(result);
    }
    [Fact]
    public void IsSeasonLive_Feb29GraceDay_NonLeapBoundaryYear_ClampsToLastDayOfMonth()
    {
        var options = new CacheOptions { SeasonBoundaryGraceMonth = 2, SeasonBoundaryGraceDay = 29 };
        // Season 2026 -> boundary year 2027, which is not a leap year, so Feb 29 clamps to Feb 28.
        var utcNow = new DateTime(2027, 2, 28, 12, 0, 0, DateTimeKind.Utc);

        var result = SeasonLiveEvaluator.IsSeasonLive(2026, utcNow, options);

        Assert.False(result);
    }
    [Fact]
    public void IsSeasonLive_NullOptions_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() =>
            SeasonLiveEvaluator.IsSeasonLive(2025, DateTime.UtcNow, null!));
    }
}
