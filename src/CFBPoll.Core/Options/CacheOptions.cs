namespace CFBPoll.Core.Options;

public class CacheOptions
{
    public const string SECTION_NAME = "Cache";

    public int CleanupIntervalMinutes { get; set; } = 60;
    public int CleanupStartupDelayMinutes { get; set; } = 5;
    public string ConnectionString { get; set; } = "Data Source=data/cache.db";
    public int EmptyResultExpirationMinutes { get; set; } = 60;
    public int RefreshGraceMinutes { get; set; } = 30;
    public string RefreshTimeOfDay { get; set; } = "03:00";
    public string RefreshTimeZone { get; set; } = "America/New_York";
    public int SeasonBoundaryGraceDay { get; set; } = 1;
    public int SeasonBoundaryGraceMonth { get; set; } = 3;
    public DayOfWeek WeeklyRefreshDay { get; set; } = DayOfWeek.Monday;
}
