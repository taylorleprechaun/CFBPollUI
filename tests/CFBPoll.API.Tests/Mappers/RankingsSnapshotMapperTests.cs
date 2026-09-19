using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class RankingsSnapshotMapperTests
{
    [Fact]
    public void ToDTO_MapsAllProperties()
    {
        var summary = new RankingsSnapshotSummary
        {
            AlgorithmVersion = RatingAlgorithmVersion.V1,
            CreatedAt = new DateTime(2024, 9, 1, 12, 0, 0, DateTimeKind.Utc),
            IsPublished = true,
            Season = 2024,
            Week = 5
        };

        var result = RankingsSnapshotMapper.ToDTO(summary);

        Assert.Equal("V1", result.AlgorithmVersion);
        Assert.Equal(new DateTime(2024, 9, 1, 12, 0, 0, DateTimeKind.Utc), result.CreatedAt);
        Assert.True(result.IsPublished);
        Assert.Equal(2024, result.Season);
        Assert.Equal(5, result.Week);
    }

    [Fact]
    public void ToDTO_MapsStaleScoreOverrides()
    {
        var summary = new RankingsSnapshotSummary
        {
            Season = 2025,
            StaleScoreOverrides =
            [
                new ScoreOverrideDifference { AwayTeam = "Iowa", GameID = 401234561, HomeTeam = "Nebraska", Kind = ScoreOverrideDifferenceKind.Added },
                new ScoreOverrideDifference { AwayTeam = "Texas", GameID = 401234562, HomeTeam = "Oklahoma", Kind = ScoreOverrideDifferenceKind.Removed }
            ],
            Week = 6
        };

        var result = RankingsSnapshotMapper.ToDTO(summary);

        var differences = result.StaleScoreOverrides.ToList();
        Assert.Equal(2, differences.Count);
        Assert.Equal("Added", differences[0].Kind);
        Assert.Equal(401234561, differences[0].GameID);
        Assert.Equal("Iowa", differences[0].AwayTeam);
        Assert.Equal("Nebraska", differences[0].HomeTeam);
        Assert.Equal("Removed", differences[1].Kind);
    }

    [Fact]
    public void ToDTO_NullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => RankingsSnapshotMapper.ToDTO(null!));
    }

    [Fact]
    public void ToDTO_SnapshotWithoutStaleScoreOverrides_MapsEmptyList()
    {
        var result = RankingsSnapshotMapper.ToDTO(new RankingsSnapshotSummary { Season = 2025, Week = 6 });

        Assert.Empty(result.StaleScoreOverrides);
    }

    [Fact]
    public void ToDTO_UnpublishedRankingsSnapshot_MapsPublishedFalse()
    {
        var summary = new RankingsSnapshotSummary
        {
            AlgorithmVersion = RatingAlgorithmVersion.V1,
            CreatedAt = new DateTime(2024, 9, 8, 12, 0, 0, DateTimeKind.Utc),
            IsPublished = false,
            Season = 2024,
            Week = 2
        };

        var result = RankingsSnapshotMapper.ToDTO(summary);

        Assert.False(result.IsPublished);
    }

    [Fact]
    public void ToDTO_V2RankingsSnapshot_MapsAlgorithmVersionString()
    {
        var summary = new RankingsSnapshotSummary
        {
            AlgorithmVersion = RatingAlgorithmVersion.V2,
            CreatedAt = new DateTime(2024, 9, 8, 12, 0, 0, DateTimeKind.Utc),
            IsPublished = false,
            Season = 2025,
            Week = 1
        };

        var result = RankingsSnapshotMapper.ToDTO(summary);

        Assert.Equal("V2", result.AlgorithmVersion);
    }

    [Fact]
    public void ToStaleScoreOverrideDTO_NullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => RankingsSnapshotMapper.ToStaleScoreOverrideDTO(null!));
    }
}
