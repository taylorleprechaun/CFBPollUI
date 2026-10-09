using CFBPoll.Core.Caching;
using CFBPoll.Core.Options;
using CFBPoll.Core.Tests.TestDoubles;
using Xunit;

namespace CFBPoll.Core.Tests.Caching;

public class CacheExpirationPolicyTests
{
    [Fact]
    public void Constructor_InvalidRefreshTimeOfDay_ThrowsFormatException()
    {
        var options = new CacheOptions { RefreshTimeOfDay = "3am" };

        Assert.Throws<FormatException>(() => CreatePolicy(Utc(2026, 10, 8, 12), options));
    }

    [Fact]
    public void Constructor_NullOptions_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new CacheExpirationPolicy(null!, TimeProvider.System));
    }

    [Fact]
    public void Constructor_NullTimeProvider_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new CacheExpirationPolicy(Microsoft.Extensions.Options.Options.Create(new CacheOptions()), null!));
    }

    [Fact]
    public void GetEmptyResultExpiration_ReturnsNowPlusConfiguredMinutes()
    {
        var policy = CreatePolicy(Utc(2026, 10, 8, 12), new CacheOptions { EmptyResultExpirationMinutes = 60 });

        var result = policy.GetEmptyResultExpiration();

        Assert.Equal(Utc(2026, 10, 8, 13), result);
    }

    [Fact]
    public void GetExpiration_Daily_ReturnsNextRefreshPlusGrace()
    {
        // 2:00am EDT Thursday; next refresh is 3:00am EDT (07:00 UTC) the same day
        var policy = CreatePolicy(Utc(2026, 10, 8, 6), new CacheOptions { RefreshGraceMinutes = 30 });

        var result = policy.GetExpiration(CacheRefreshTier.Daily);

        Assert.Equal(Utc(2026, 10, 8, 7, 30), result);
    }

    [Fact]
    public void GetNextRefreshUTC_DailyAfterRefreshTime_ReturnsNextDay()
    {
        // 4:00am EDT Thursday
        var policy = CreatePolicy(Utc(2026, 10, 8, 8));

        var result = policy.GetNextRefreshUTC(CacheRefreshTier.Daily);

        Assert.Equal(Utc(2026, 10, 9, 7), result);
    }

    [Fact]
    public void GetNextRefreshUTC_DailyAtExactRefreshTime_ReturnsNextDay()
    {
        var policy = CreatePolicy(Utc(2026, 10, 8, 7));

        var result = policy.GetNextRefreshUTC(CacheRefreshTier.Daily);

        Assert.Equal(Utc(2026, 10, 9, 7), result);
    }

    [Fact]
    public void GetNextRefreshUTC_DailyBeforeRefreshTime_ReturnsSameDay()
    {
        // 2:00am EDT Thursday
        var policy = CreatePolicy(Utc(2026, 10, 8, 6));

        var result = policy.GetNextRefreshUTC(CacheRefreshTier.Daily);

        Assert.Equal(Utc(2026, 10, 8, 7), result);
    }

    [Fact]
    public void GetNextRefreshUTC_DailyOnFallBackDay_UsesStandardTimeOffset()
    {
        // 4:00am EDT Saturday Oct 31; DST ends Sunday Nov 1, so 3:00am that day is EST (UTC-5)
        var policy = CreatePolicy(Utc(2026, 10, 31, 8));

        var result = policy.GetNextRefreshUTC(CacheRefreshTier.Daily);

        Assert.Equal(Utc(2026, 11, 1, 8), result);
    }

    [Fact]
    public void GetNextRefreshUTC_DailyOnSpringForwardDay_UsesDaylightOffset()
    {
        // 4:00am EST Saturday Mar 7; DST starts Sunday Mar 8, so 3:00am that day is EDT (UTC-4)
        var policy = CreatePolicy(Utc(2026, 3, 7, 9));

        var result = policy.GetNextRefreshUTC(CacheRefreshTier.Daily);

        Assert.Equal(Utc(2026, 3, 8, 7), result);
    }

    [Fact]
    public void GetNextRefreshUTC_RefreshTimeInSpringForwardGap_ShiftsToFirstValidTime()
    {
        // 2:30am doesn't exist on Mar 8 (clocks jump 2:00 -> 3:00 EDT), so the refresh runs at 3:00am EDT
        var policy = CreatePolicy(Utc(2026, 3, 7, 12), new CacheOptions { RefreshTimeOfDay = "02:30" });

        var result = policy.GetNextRefreshUTC(CacheRefreshTier.Daily);

        Assert.Equal(Utc(2026, 3, 8, 7), result);
    }

    [Fact]
    public void GetNextRefreshUTC_WeeklyMidWeek_ReturnsNextMonday()
    {
        // Thursday Oct 8
        var policy = CreatePolicy(Utc(2026, 10, 8, 12));

        var result = policy.GetNextRefreshUTC(CacheRefreshTier.Weekly);

        Assert.Equal(Utc(2026, 10, 12, 7), result);
    }

    [Fact]
    public void GetNextRefreshUTC_WeeklyOnRefreshDayAfterRefreshTime_ReturnsFollowingWeek()
    {
        // 4:00am EDT Monday Oct 12
        var policy = CreatePolicy(Utc(2026, 10, 12, 8));

        var result = policy.GetNextRefreshUTC(CacheRefreshTier.Weekly);

        Assert.Equal(Utc(2026, 10, 19, 7), result);
    }

    [Fact]
    public void GetNextRefreshUTC_WeeklySundayNight_ReturnsNextMorning()
    {
        // 11:00pm EDT Sunday Oct 11 is already Monday in UTC; the refresh is still Monday 3:00am EDT
        var policy = CreatePolicy(Utc(2026, 10, 12, 3));

        var result = policy.GetNextRefreshUTC(CacheRefreshTier.Weekly);

        Assert.Equal(Utc(2026, 10, 12, 7), result);
    }

    [Fact]
    public void GetSeasonExpiration_ConcludedSeason_ReturnsMaxValue()
    {
        var policy = CreatePolicy(Utc(2026, 10, 8, 12));

        var result = policy.GetSeasonExpiration(2024, CacheRefreshTier.Daily);

        Assert.Equal(DateTime.MaxValue, result);
    }

    [Fact]
    public void GetSeasonExpiration_LiveSeason_ReturnsTierExpiration()
    {
        // 4:00am EDT Thursday; next daily refresh is Friday 3:00am EDT, plus 30 minutes of grace
        var policy = CreatePolicy(Utc(2026, 10, 8, 8));

        var result = policy.GetSeasonExpiration(2026, CacheRefreshTier.Daily);

        Assert.Equal(Utc(2026, 10, 9, 7, 30), result);
    }

    private static CacheExpirationPolicy CreatePolicy(DateTime utcNow, CacheOptions? options = null)
    {
        return new CacheExpirationPolicy(
            Microsoft.Extensions.Options.Options.Create(options ?? new CacheOptions()),
            new FixedTimeProvider(new DateTimeOffset(utcNow, TimeSpan.Zero)));
    }

    private static DateTime Utc(int year, int month, int day, int hour, int minute = 0) =>
        new(year, month, day, hour, minute, 0, DateTimeKind.Utc);
}
