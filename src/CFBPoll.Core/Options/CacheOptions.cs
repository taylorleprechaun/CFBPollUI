namespace CFBPoll.Core.Options;

public class CacheOptions
{
    public const string SectionName = "Cache";

    public string CacheDirectory { get; set; } = "cache";
    public int CalendarExpirationHours { get; set; } = 168;
    public int ConferenceExpirationHours { get; set; } = 720;
    public int MaxSeasonYearExpirationHours { get; set; } = 24;
    public int SeasonDataExpirationHours { get; set; } = 144;
}
