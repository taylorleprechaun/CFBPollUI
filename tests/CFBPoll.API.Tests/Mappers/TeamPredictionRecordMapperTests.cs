using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class TeamPredictionRecordMapperTests
{
    [Fact]
    public void ToDTO_MapsAllProperties()
    {
        var record = new TeamPredictionRecord
        {
            ActualLosses = 3,
            ActualWins = 7,
            GradedGameCount = 10,
            LogoURL = "https://example.com/michigan.png",
            PredictedLosses = 2,
            PredictedWins = 8,
            TeamName = "Michigan"
        };

        var result = TeamPredictionRecordMapper.ToDTO(record);

        Assert.Equal(3, result.ActualLosses);
        Assert.Equal(7, result.ActualWins);
        Assert.Equal(10, result.GradedGameCount);
        Assert.Equal("https://example.com/michigan.png", result.LogoURL);
        Assert.Equal(2, result.PredictedLosses);
        Assert.Equal(8, result.PredictedWins);
        Assert.Equal("Michigan", result.TeamName);
    }

    [Fact]
    public void ToDTO_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => TeamPredictionRecordMapper.ToDTO(null!));
    }

    [Fact]
    public void ToResponseDTO_MapsSeasonAndRecords()
    {
        var records = new List<TeamPredictionRecord>
        {
            new() { TeamName = "Alabama" },
            new() { TeamName = "Texas" }
        };

        var dto = TeamPredictionRecordMapper.ToResponseDTO(2024, records);

        Assert.Equal(2024, dto.Season);
        Assert.Equal(2, dto.Records.Count());
    }

    [Fact]
    public void ToResponseDTO_PreservesRecordOrder()
    {
        var records = new List<TeamPredictionRecord>
        {
            new() { TeamName = "Alabama" },
            new() { TeamName = "Michigan" },
            new() { TeamName = "Texas" }
        };

        var dto = TeamPredictionRecordMapper.ToResponseDTO(2024, records).Records.ToList();

        Assert.Equal("Alabama", dto[0].TeamName);
        Assert.Equal("Michigan", dto[1].TeamName);
        Assert.Equal("Texas", dto[2].TeamName);
    }

    [Fact]
    public void ToResponseDTO_WithEmptyRecords_ReturnsEmptyList()
    {
        var dto = TeamPredictionRecordMapper.ToResponseDTO(2024, new List<TeamPredictionRecord>());

        Assert.Empty(dto.Records);
    }

    [Fact]
    public void ToResponseDTO_WithNullRecords_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => TeamPredictionRecordMapper.ToResponseDTO(2024, null!));
    }
}
