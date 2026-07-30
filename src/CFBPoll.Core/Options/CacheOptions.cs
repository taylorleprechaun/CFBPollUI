namespace CFBPoll.Core.Options;

public class CacheOptions
{
    public const string SectionName = "Cache";

    public int CalendarExpirationHours { get; set; } = 168;
    public int CleanupIntervalMinutes { get; set; } = 60;
    public int CleanupStartupDelayMinutes { get; set; } = 5;
    public int ConferenceExpirationHours { get; set; } = 720;
    public string ConnectionString { get; set; } = "Data Source=data/cache.db";
    public int MaxSeasonYearExpirationHours { get; set; } = 24;
    public int PollLeadersExpirationHours { get; set; } = 24;
    public int SeasonBoundaryGraceDay { get; set; } = 1;
    public int SeasonBoundaryGraceMonth { get; set; } = 3;
    public int SeasonDataExpirationHours { get; set; } = 144;
    public int SeasonTrendsExpirationHours { get; set; } = 24;
}
