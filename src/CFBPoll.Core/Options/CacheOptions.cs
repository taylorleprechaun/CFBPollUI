namespace CFBPoll.Core.Options;

public class CacheOptions
{
    public const string SectionName = "Cache";

    public int CalendarExpirationHours { get; set; } = 168;
    public int ConferenceExpirationHours { get; set; } = 720;
    public string ConnectionString { get; set; } = "Data Source=data/cache.db";
    public int MaxSeasonYearExpirationHours { get; set; } = 24;
    public int SeasonDataExpirationHours { get; set; } = 144;
}
