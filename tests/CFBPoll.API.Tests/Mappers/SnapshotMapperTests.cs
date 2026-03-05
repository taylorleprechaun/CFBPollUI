using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class SnapshotMapperTests
{
    [Fact]
    public void ToDTO_MapsAllProperties()
    {
        var summary = new SnapshotSummary
        {
            CreatedAt = new DateTime(2024, 9, 1, 12, 0, 0, DateTimeKind.Utc),
            Published = true,
            Season = 2024,
            Week = 5
        };

        var result = SnapshotMapper.ToDTO(summary);

        Assert.Equal(new DateTime(2024, 9, 1, 12, 0, 0, DateTimeKind.Utc), result.CreatedAt);
        Assert.True(result.IsPublished);
        Assert.Equal(2024, result.Season);
        Assert.Equal(5, result.Week);
    }

    [Fact]
    public void ToDTO_UnpublishedSnapshot_MapsPublishedFalse()
    {
        var summary = new SnapshotSummary
        {
            CreatedAt = new DateTime(2024, 9, 8, 12, 0, 0, DateTimeKind.Utc),
            Published = false,
            Season = 2024,
            Week = 2
        };

        var result = SnapshotMapper.ToDTO(summary);

        Assert.False(result.IsPublished);
    }

    [Fact]
    public void ToDTO_NullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => SnapshotMapper.ToDTO(null!));
    }
}
