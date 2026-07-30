using CFBPoll.Core.Options;

namespace CFBPoll.Core.Caching;

public static class SeasonLiveEvaluator
{
    /// <summary>
    /// A season is "live" until a configurable grace-period cutoff in the following calendar
    /// year, so postseason data (which can run into January under the prior year's season
    /// number) isn't treated as permanently concluded while it's still being played/corrected.
    /// </summary>
    public static bool IsSeasonLive(int season, DateTime utcNow, CacheOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var boundaryYear = season + 1;
        var day = Math.Min(options.SeasonBoundaryGraceDay, DateTime.DaysInMonth(boundaryYear, options.SeasonBoundaryGraceMonth));
        var boundary = new DateTime(boundaryYear, options.SeasonBoundaryGraceMonth, day, 0, 0, 0, DateTimeKind.Utc);

        return utcNow < boundary;
    }
}
