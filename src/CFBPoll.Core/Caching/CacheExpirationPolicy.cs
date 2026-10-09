using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace CFBPoll.Core.Caching;

public sealed class CacheExpirationPolicy : ICacheExpirationPolicy
{
    private readonly CacheOptions _options;
    private readonly TimeOnly _refreshTime;
    private readonly TimeProvider _timeProvider;
    private readonly TimeZoneInfo _timeZone;

    public CacheExpirationPolicy(IOptions<CacheOptions> options, TimeProvider timeProvider)
    {
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

        _refreshTime = TimeOnly.ParseExact(_options.RefreshTimeOfDay, "HH:mm", CultureInfo.InvariantCulture);
        _timeZone = TimeZoneInfo.FindSystemTimeZoneById(_options.RefreshTimeZone);
    }

    public DateTime GetEmptyResultExpiration()
    {
        return _timeProvider.GetUtcNow().UtcDateTime.AddMinutes(_options.EmptyResultExpirationMinutes);
    }

    public DateTime GetExpiration(CacheRefreshTier tier)
    {
        return GetNextRefreshUTC(tier).AddMinutes(_options.RefreshGraceMinutes);
    }

    public DateTime GetNextRefreshUTC(CacheRefreshTier tier)
    {
        var nowUTC = _timeProvider.GetUtcNow().UtcDateTime;
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(nowUTC, _timeZone));

        // Eight days covers the weekly tier when today is the refresh day but its refresh time has passed
        for (var dayOffset = 0; dayOffset <= 7; dayOffset++)
        {
            var date = today.AddDays(dayOffset);
            if (tier == CacheRefreshTier.Weekly && date.DayOfWeek != _options.WeeklyRefreshDay)
                continue;

            var refreshUTC = ToUTC(date.ToDateTime(_refreshTime));
            if (refreshUTC > nowUTC)
                return refreshUTC;
        }

        throw new InvalidOperationException($"No refresh time found within a week for tier {tier}.");
    }

    public DateTime GetSeasonExpiration(int season, CacheRefreshTier tier)
    {
        if (!SeasonLiveEvaluator.IsSeasonLive(season, _timeProvider.GetUtcNow().UtcDateTime, _options))
            return DateTime.MaxValue;

        return GetExpiration(tier);
    }

    private DateTime ToUTC(DateTime localTime)
    {
        // A refresh time inside a spring-forward gap doesn't exist locally; run at the first valid minute after it
        while (_timeZone.IsInvalidTime(localTime))
        {
            localTime = localTime.AddMinutes(1);
        }

        return TimeZoneInfo.ConvertTimeToUtc(localTime, _timeZone);
    }
}
