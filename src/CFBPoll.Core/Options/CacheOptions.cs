namespace CFBPoll.Core.Options;

public class CacheOptions
{
    public const string SectionName = "Cache";

    public string CacheDirectory { get; set; } = "cache";
    public int CalendarExpirationHours { get; set; } = 168;
    public int MaxSeasonYearExpirationHours { get; set; } = 24;
    public int RankingsExpirationHours { get; set; } = 144;
    public int SeasonDataExpirationHours { get; set; } = 144;
}
