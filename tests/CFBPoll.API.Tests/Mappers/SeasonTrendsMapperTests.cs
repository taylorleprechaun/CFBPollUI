using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class SeasonTrendsMapperTests
{
    [Fact]
    public void ToResponseDTO_NullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => SeasonTrendsMapper.ToResponseDTO(null!));
    }

    [Fact]
    public void ToResponseDTO_MapsAllProperties()
    {
        var model = new SeasonTrendsResult
        {
            Season = 2024,
            Teams = new List<SeasonTrendTeam>
            {
                new()
                {
                    AltColor = "#FFCB05",
                    Color = "#00274C",
                    Conference = "Big Ten",
                    LogoURL = "https://example.com/michigan.png",
                    Rankings = new List<SeasonTrendRanking>
                    {
                        new() { Rank = 3, Rating = 88.5, Record = "7-2", WeekNumber = 5 }
                    },
                    TeamName = "Michigan"
                }
            },
            Weeks = new List<SeasonTrendWeek>
            {
                new() { Label = "Week 6", WeekNumber = 5 }
            }
        };

        var result = SeasonTrendsMapper.ToResponseDTO(model);

        Assert.Equal(2024, result.Season);
        Assert.Single(result.Teams);
        Assert.Equal("Michigan", result.Teams.First().TeamName);
        Assert.Equal("#00274C", result.Teams.First().Color);
        Assert.Equal("#FFCB05", result.Teams.First().AltColor);
        Assert.Equal("Big Ten", result.Teams.First().Conference);
        Assert.Single(result.Teams.First().Rankings);
        Assert.Equal(3, result.Teams.First().Rankings.First().Rank);
        Assert.Equal(88.5, result.Teams.First().Rankings.First().Rating);
        Assert.Equal("7-2", result.Teams.First().Rankings.First().Record);
        Assert.Equal(5, result.Teams.First().Rankings.First().WeekNumber);
        Assert.Single(result.Weeks);
        Assert.Equal("Week 6", result.Weeks.First().Label);
        Assert.Equal(5, result.Weeks.First().WeekNumber);
    }

    [Fact]
    public void ToResponseDTO_EmptyCollections_MapsCorrectly()
    {
        var model = new SeasonTrendsResult { Season = 2024 };

        var result = SeasonTrendsMapper.ToResponseDTO(model);

        Assert.Equal(2024, result.Season);
        Assert.Empty(result.Teams);
        Assert.Empty(result.Weeks);
    }

    [Fact]
    public void ToTeamDTO_NullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => SeasonTrendsMapper.ToTeamDTO(null!));
    }

    [Fact]
    public void ToRankingDTO_NullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => SeasonTrendsMapper.ToRankingDTO(null!));
    }

    [Fact]
    public void ToWeekDTO_NullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => SeasonTrendsMapper.ToWeekDTO(null!));
    }

    [Fact]
    public void ToRankingDTO_NullRank_PreservesNull()
    {
        var model = new SeasonTrendRanking
        {
            Rank = null,
            Rating = 0,
            Record = "",
            WeekNumber = 3
        };

        var result = SeasonTrendsMapper.ToRankingDTO(model);

        Assert.Null(result.Rank);
        Assert.Equal(3, result.WeekNumber);
    }

    [Fact]
    public void ToResponseDTO_MultipleTeamsAndWeeks_MapsAll()
    {
        var model = new SeasonTrendsResult
        {
            Season = 2023,
            Teams = new List<SeasonTrendTeam>
            {
                new() { TeamName = "Texas", Color = "#BF5700", AltColor = "#FFFFFF", Conference = "SEC", LogoURL = "https://example.com/texas.png", Rankings = new List<SeasonTrendRanking>() },
                new() { TeamName = "Oklahoma", Color = "#841617", AltColor = "#FDF9D8", Conference = "SEC", LogoURL = "https://example.com/oklahoma.png", Rankings = new List<SeasonTrendRanking>() },
            },
            Weeks = new List<SeasonTrendWeek>
            {
                new() { Label = "Week 2", WeekNumber = 1 },
                new() { Label = "Week 3", WeekNumber = 2 },
            }
        };

        var result = SeasonTrendsMapper.ToResponseDTO(model);

        Assert.Equal(2, result.Teams.Count());
        Assert.Equal(2, result.Weeks.Count());
    }
}
