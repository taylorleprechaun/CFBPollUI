using CFBPoll.Core.Models;

namespace CFBPoll.Core.Caching;

/// <summary>
/// Parses a raw cache key (as built by <see cref="CacheKeys"/> or one of the module-owned result-cache
/// prefixes) into a display-friendly family/season/detail grouping for the admin cache management UI.
/// Unrecognized keys fall back to an "Other" family rather than throwing, so a future cache producer
/// that forgets to update this parser degrades gracefully instead of breaking the admin page.
/// </summary>
public static class CacheKeyDescriptor
{
    private const string FAMILY_OTHER = "Other";

    public static CacheEntrySummary Describe(CacheEntryMetadata metadata)
    {
        ArgumentNullException.ThrowIfNull(metadata);

        var (family, season, detail) = ParseKey(metadata.CacheKey);

        return new CacheEntrySummary
        {
            CachedAt = metadata.CachedAt,
            CacheKey = metadata.CacheKey,
            Detail = detail,
            ExpiresAt = metadata.ExpiresAt,
            Family = family,
            Season = season,
            SizeBytes = metadata.SizeBytes
        };
    }

    private static string Capitalize(string value) =>
        value.Length == 0 ? value : char.ToUpperInvariant(value[0]) + value[1..];

    private static (string Family, int? Season, string Detail) ParseKey(string key)
    {
        switch (key)
        {
            case "cfbdUsage":
                return ("CFBD API Usage", null, string.Empty);
            case "conferences":
                return ("Conferences", null, string.Empty);
            case "maxSeasonYear":
                return ("Max Season Year", null, string.Empty);
            case "track-record_all":
                return ("Track Record", null, string.Empty);
        }

        var parts = key.Split('_');

        if (TryParseSeasonType(parts, "advancedGameStats", "Advanced Game Stats", out var advancedGameStats))
            return advancedGameStats;

        if (parts.Length == 3 && parts[0] == "bettingLines" && int.TryParse(parts[1], out var bettingLinesSeason))
            return ("Betting Lines", bettingLinesSeason, $"Week {parts[2]}");

        if (parts.Length == 2 && parts[0] == "calendar" && int.TryParse(parts[1], out var calendarYear))
            return ("Calendar", calendarYear, string.Empty);

        if (parts.Length == 2 && parts[0] == "fullSchedule" && int.TryParse(parts[1], out var fullScheduleSeason))
            return ("Full Schedule", fullScheduleSeason, string.Empty);

        if (TryParseSeasonType(parts, "gameTeamStats", "Game Team Stats", out var gameTeamStats))
            return gameTeamStats;

        if (TryParseSeasonType(parts, "games", "Games", out var games))
            return games;

        if (key.StartsWith("poll-leaders_", StringComparison.Ordinal))
        {
            var range = key["poll-leaders_".Length..].Replace('_', '–');
            return ("Poll Leaders", null, range);
        }

        if (parts.Length == 4 && parts[0] == "seasonStats" && parts[2] == "week" &&
            int.TryParse(parts[1], out var seasonStatsWeekSeason) && int.TryParse(parts[3], out var week))
            return ("Season Stats", seasonStatsWeekSeason, $"Through Week {week}");

        if (parts.Length == 2 && parts[0] == "seasonStats" && int.TryParse(parts[1], out var seasonStatsSeason))
            return ("Season Stats", seasonStatsSeason, "Full Season");

        if (key.StartsWith("season-trends_", StringComparison.Ordinal) &&
            int.TryParse(key["season-trends_".Length..], out var seasonTrendsSeason))
            return ("Season Trends", seasonTrendsSeason, string.Empty);

        if (key.StartsWith("team-prediction-records_", StringComparison.Ordinal) &&
            int.TryParse(key["team-prediction-records_".Length..], out var teamPredictionSeason))
            return ("Team Prediction Records", teamPredictionSeason, string.Empty);

        if (parts.Length == 2 && parts[0] == "teams" && int.TryParse(parts[1], out var teamsSeason))
            return ("Teams", teamsSeason, string.Empty);

        return (FAMILY_OTHER, null, key);
    }

    private static bool TryParseSeasonType(string[] parts, string prefix, string familyName, out (string Family, int? Season, string Detail) result)
    {
        if (parts.Length == 3 && parts[0] == prefix && int.TryParse(parts[1], out var season))
        {
            result = (familyName, season, Capitalize(parts[2]));
            return true;
        }

        result = default;
        return false;
    }
}
