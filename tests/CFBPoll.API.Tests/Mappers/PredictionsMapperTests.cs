using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class PredictionsMapperTests
{
    [Fact]
    public void ToDTO_MapsAllProperties()
    {
        var prediction = new GamePrediction
        {
            AwayTeam = "Michigan",
            Confidence = 75.5,
            HomeTeam = "Ohio State",
            HomeWinProbability = 0.72,
            NeutralSite = false,
            PredictedMargin = 10.5,
            PredictedWinner = "Ohio State"
        };

        var result = PredictionsMapper.ToDTO(prediction);

        Assert.Equal("Michigan", result.AwayTeam);
        Assert.Equal(75.5, result.Confidence);
        Assert.Equal("Ohio State", result.HomeTeam);
        Assert.Equal(0.72, result.HomeWinProbability);
        Assert.False(result.NeutralSite);
        Assert.Equal(10.5, result.PredictedMargin);
        Assert.Equal("Ohio State", result.PredictedWinner);
    }

    [Fact]
    public void ToDTO_NeutralSiteGame_MapsCorrectly()
    {
        var prediction = new GamePrediction
        {
            AwayTeam = "Texas",
            Confidence = 60,
            HomeTeam = "Oklahoma",
            HomeWinProbability = 0.55,
            NeutralSite = true,
            PredictedMargin = 3.0,
            PredictedWinner = "Texas"
        };

        var result = PredictionsMapper.ToDTO(prediction);

        Assert.True(result.NeutralSite);
    }

    [Fact]
    public void ToDTO_NullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => PredictionsMapper.ToDTO((GamePrediction)null!));
    }

    [Fact]
    public void ToResponseDTO_MapsAllProperties()
    {
        var predictionsResult = new PredictionsResult
        {
            Season = 2024,
            Week = 5,
            Predictions =
            [
                new GamePrediction
                {
                    AwayTeam = "Iowa",
                    HomeTeam = "Nebraska",
                    PredictedWinner = "Nebraska",
                    PredictedMargin = 7.0,
                    Confidence = 65,
                    HomeWinProbability = 0.68
                }
            ]
        };

        var result = PredictionsMapper.ToResponseDTO(predictionsResult);

        Assert.Equal(2024, result.Season);
        Assert.Equal(5, result.Week);
        var prediction = Assert.Single(result.Predictions);
        Assert.Equal("Nebraska", prediction.PredictedWinner);
    }

    [Fact]
    public void ToResponseDTO_NullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => PredictionsMapper.ToResponseDTO(null!));
    }

    [Fact]
    public void ToSummaryDTO_MapsAllProperties()
    {
        var summary = new PredictionsSummary
        {
            CreatedAt = new DateTime(2024, 9, 1, 12, 0, 0, DateTimeKind.Utc),
            GameCount = 15,
            IsPublished = true,
            Season = 2024,
            Week = 5
        };

        var result = PredictionsMapper.ToSummaryDTO(summary);

        Assert.Equal(new DateTime(2024, 9, 1, 12, 0, 0, DateTimeKind.Utc), result.CreatedAt);
        Assert.Equal(15, result.GameCount);
        Assert.True(result.IsPublished);
        Assert.Equal(2024, result.Season);
        Assert.Equal(5, result.Week);
    }

    [Fact]
    public void ToSummaryDTO_UnpublishedPrediction_MapsPublishedFalse()
    {
        var summary = new PredictionsSummary
        {
            CreatedAt = new DateTime(2024, 9, 8, 12, 0, 0, DateTimeKind.Utc),
            GameCount = 10,
            IsPublished = false,
            Season = 2024,
            Week = 2
        };

        var result = PredictionsMapper.ToSummaryDTO(summary);

        Assert.False(result.IsPublished);
    }

    [Fact]
    public void ToSummaryDTO_NullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => PredictionsMapper.ToSummaryDTO(null!));
    }
}
