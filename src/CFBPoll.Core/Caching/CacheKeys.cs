namespace CFBPoll.Core.Caching;

public static class CacheKeys
{
    public const string CFBD_USAGE = "cfbdUsage";
    public const string CONFERENCES = "conferences";
    public const string MAX_SEASON_YEAR = "maxSeasonYear";

    public static string AdvancedGameStats(int season, string seasonType) => $"advancedGameStats_{season}_{seasonType}";
    public static string BettingLines(int season, int week) => $"bettingLines_{season}_{week}";
    public static string Calendar(int year) => $"calendar_{year}";
    public static string FullSchedule(int season) => $"fullSchedule_{season}";
    public static string Games(int season, string seasonType) => $"games_{season}_{seasonType}";
    public static string GameTeamStats(int season, string seasonType) => $"gameTeamStats_{season}_{seasonType}";

    public static IEnumerable<string> GetSeasonScopedKeys(int season, int week)
    {
        var gameWeek = week + 1;

        yield return Teams(season);
        yield return FullSchedule(season);
        yield return Games(season, "regular");
        yield return Games(season, "postseason");
        yield return AdvancedGameStats(season, "regular");
        yield return AdvancedGameStats(season, "postseason");
        yield return GameTeamStats(season, "regular");
        yield return GameTeamStats(season, "postseason");
        yield return SeasonStats(season, null);
        yield return SeasonStats(season, week);
        yield return BettingLines(season, gameWeek);

        if (gameWeek != 1)
        {
            yield return BettingLines(season, 1);
        }
    }

    public static string SeasonStats(int season, int? endWeek) =>
        endWeek.HasValue ? $"seasonStats_{season}_week_{endWeek.Value}" : $"seasonStats_{season}";

    public static string Teams(int season) => $"teams_{season}";
}
