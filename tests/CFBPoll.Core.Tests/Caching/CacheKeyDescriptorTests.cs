using CFBPoll.Core.Caching;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.Core.Tests.Caching;

public class CacheKeyDescriptorTests
{
    [Theory]
    [InlineData("advancedGameStats_2024_regular", "Advanced Game Stats", 2024, "Regular")]
    [InlineData("advancedGameStats_2024_postseason", "Advanced Game Stats", 2024, "Postseason")]
    [InlineData("bettingLines_2024_6", "Betting Lines", 2024, "Week 6")]
    [InlineData("calendar_2024", "Calendar", 2024, "")]
    [InlineData("cfbdUsage", "CFBD API Usage", null, "")]
    [InlineData("conferences", "Conferences", null, "")]
    [InlineData("fullSchedule_2024", "Full Schedule", 2024, "")]
    [InlineData("gameTeamStats_2024_regular", "Game Team Stats", 2024, "Regular")]
    [InlineData("games_2024_postseason", "Games", 2024, "Postseason")]
    [InlineData("maxSeasonYear", "Max Season Year", null, "")]
    [InlineData("poll-leaders_2020_2023", "Poll Leaders", null, "2020–2023")]
    [InlineData("seasonStats_2024", "Season Stats", 2024, "Full Season")]
    [InlineData("seasonStats_2024_week_5", "Season Stats", 2024, "Through Week 5")]
    [InlineData("season-trends_2024", "Season Trends", 2024, "")]
    [InlineData("team-prediction-records_2024", "Team Prediction Records", 2024, "")]
    [InlineData("teams_2024", "Teams", 2024, "")]
    [InlineData("track-record_all", "Track Record", null, "")]
    [InlineData("some-unrecognized-key_2024", "Other", null, "some-unrecognized-key_2024")]
    [InlineData("advancedGameStats_abc_regular", "Other", null, "advancedGameStats_abc_regular")]
    [InlineData("bettingLines_abc_6", "Other", null, "bettingLines_abc_6")]
    [InlineData("calendar_abc", "Other", null, "calendar_abc")]
    [InlineData("fullSchedule_abc", "Other", null, "fullSchedule_abc")]
    [InlineData("seasonStats_abc", "Other", null, "seasonStats_abc")]
    [InlineData("seasonStats_2024_week_abc", "Other", null, "seasonStats_2024_week_abc")]
    [InlineData("season-trends_abc", "Other", null, "season-trends_abc")]
    [InlineData("team-prediction-records_abc", "Other", null, "team-prediction-records_abc")]
    [InlineData("teams_abc", "Other", null, "teams_abc")]
    public void Describe_ParsesFamilySeasonAndDetail(string cacheKey, string expectedFamily, int? expectedSeason, string expectedDetail)
    {
        var metadata = new CacheEntryMetadata
        {
            CacheKey = cacheKey,
            CachedAt = new DateTime(2026, 8, 1),
            ExpiresAt = new DateTime(2026, 9, 1),
            SizeBytes = 123
        };

        var result = CacheKeyDescriptor.Describe(metadata);

        Assert.Equal(expectedFamily, result.Family);
        Assert.Equal(expectedSeason, result.Season);
        Assert.Equal(expectedDetail, result.Detail);
        Assert.Equal(cacheKey, result.CacheKey);
        Assert.Equal(metadata.CachedAt, result.CachedAt);
        Assert.Equal(metadata.ExpiresAt, result.ExpiresAt);
        Assert.Equal(metadata.SizeBytes, result.SizeBytes);
    }

    [Fact]
    public void Describe_ThrowsOnNullMetadata()
    {
        Assert.Throws<ArgumentNullException>(() => CacheKeyDescriptor.Describe(null!));
    }
}
