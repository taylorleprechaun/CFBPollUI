using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

using Record = CFBPoll.Core.Models.Record;

namespace CFBPoll.API.Tests.Mappers;

public class RankingsMapperTests
{
    [Fact]
    public void ToDTO_Record_MapsAllProperties()
    {
        var record = new Record { Wins = 5, Losses = 2 };

        var result = RankingsMapper.ToDTO(record);

        Assert.Equal(5, result.Wins);
        Assert.Equal(2, result.Losses);
    }

    [Fact]
    public void ToDTO_Record_WithZeroValues_MapsCorrectly()
    {
        var record = new Record { Wins = 0, Losses = 0 };

        var result = RankingsMapper.ToDTO(record);

        Assert.Equal(0, result.Wins);
        Assert.Equal(0, result.Losses);
    }

    [Fact]
    public void ToDTO_Record_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => RankingsMapper.ToDTO((Record)null!));
    }

    [Fact]
    public void ToDTO_TeamDetails_MapsAllRecords()
    {
        var details = new TeamDetails
        {
            Away = new Record { Wins = 3, Losses = 1 },
            Home = new Record { Wins = 5, Losses = 0 },
            Neutral = new Record { Wins = 1, Losses = 0 },
            VsRank1To10 = new Record { Wins = 1, Losses = 2 },
            VsRank11To25 = new Record { Wins = 2, Losses = 1 },
            VsRank26To50 = new Record { Wins = 3, Losses = 0 },
            VsRank51To100 = new Record { Wins = 2, Losses = 0 },
            VsRank101Plus = new Record { Wins = 1, Losses = 0 }
        };

        var result = RankingsMapper.ToDTO(details);

        Assert.Equal(3, result.Away.Wins);
        Assert.Equal(1, result.Away.Losses);
        Assert.Equal(5, result.Home.Wins);
        Assert.Equal(0, result.Home.Losses);
        Assert.Equal(1, result.Neutral.Wins);
        Assert.Equal(0, result.Neutral.Losses);
        Assert.Equal(1, result.VsRank1To10.Wins);
        Assert.Equal(2, result.VsRank1To10.Losses);
        Assert.Equal(2, result.VsRank11To25.Wins);
        Assert.Equal(1, result.VsRank11To25.Losses);
        Assert.Equal(3, result.VsRank26To50.Wins);
        Assert.Equal(0, result.VsRank26To50.Losses);
        Assert.Equal(2, result.VsRank51To100.Wins);
        Assert.Equal(0, result.VsRank51To100.Losses);
        Assert.Equal(1, result.VsRank101Plus.Wins);
        Assert.Equal(0, result.VsRank101Plus.Losses);
    }

    [Fact]
    public void ToDTO_TeamDetails_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => RankingsMapper.ToDTO((TeamDetails)null!));
    }

    [Fact]
    public void ToDTO_RankedTeam_MapsAllProperties()
    {
        var team = new RankedTeam
        {
            Conference = "SEC",
            Details = new TeamDetails
            {
                Home = new Record { Wins = 5, Losses = 0 },
                Away = new Record { Wins = 3, Losses = 1 }
            },
            Division = "East",
            LogoURL = "https://example.com/logo.png",
            Losses = 1,
            Rank = 1,
            Rating = 95.5,
            SOSRanking = 5,
            TeamName = "Georgia",
            WeightedSOS = 0.75,
            Wins = 11
        };

        var result = RankingsMapper.ToDTO(team);

        Assert.Equal("SEC", result.Conference);
        Assert.Equal("East", result.Division);
        Assert.Equal("https://example.com/logo.png", result.LogoURL);
        Assert.Equal(1, result.Losses);
        Assert.Equal(1, result.Rank);
        Assert.Equal(95.5, result.Rating);
        Assert.Equal(5, result.SOSRanking);
        Assert.Equal("Georgia", result.TeamName);
        Assert.Equal(0.75, result.WeightedSOS);
        Assert.Equal(11, result.Wins);
    }

    [Fact]
    public void ToDTO_RankedTeam_ComputesRecordString()
    {
        var team = new RankedTeam
        {
            Wins = 11,
            Losses = 2,
            Details = new TeamDetails()
        };

        var result = RankingsMapper.ToDTO(team);

        Assert.Equal("11-2", result.Record);
    }

    [Fact]
    public void ToDTO_RankedTeam_WithZeroRecord_ComputesCorrectly()
    {
        var team = new RankedTeam
        {
            Wins = 0,
            Losses = 0,
            Details = new TeamDetails()
        };

        var result = RankingsMapper.ToDTO(team);

        Assert.Equal("0-0", result.Record);
    }

    [Fact]
    public void ToDTO_RankedTeam_MapsNestedDetails()
    {
        var team = new RankedTeam
        {
            Details = new TeamDetails
            {
                Home = new Record { Wins = 6, Losses = 0 },
                Away = new Record { Wins = 4, Losses = 2 }
            }
        };

        var result = RankingsMapper.ToDTO(team);

        Assert.NotNull(result.Details);
        Assert.Equal(6, result.Details.Home.Wins);
        Assert.Equal(0, result.Details.Home.Losses);
        Assert.Equal(4, result.Details.Away.Wins);
        Assert.Equal(2, result.Details.Away.Losses);
    }

    [Fact]
    public void ToDTO_RankedTeam_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => RankingsMapper.ToDTO((RankedTeam)null!));
    }

    [Fact]
    public void ToResponseDTO_MapsSeasonWeekAndRankings()
    {
        var result = new RankingsResult
        {
            Season = 2024,
            Week = 12,
            Rankings = new List<RankedTeam>
            {
                new() { Rank = 1, TeamName = "Georgia", Wins = 11, Losses = 0, Details = new TeamDetails() },
                new() { Rank = 2, TeamName = "Michigan", Wins = 11, Losses = 0, Details = new TeamDetails() }
            }
        };

        var dto = RankingsMapper.ToResponseDTO(result);

        Assert.Equal(2024, dto.Season);
        Assert.Equal(12, dto.Week);
        var rankings = dto.Rankings.ToList();
        Assert.Equal(2, rankings.Count);
        Assert.Equal("Georgia", rankings[0].TeamName);
        Assert.Equal("Michigan", rankings[1].TeamName);
    }

    [Fact]
    public void ToResponseDTO_WithEmptyRankings_ReturnsEmptyList()
    {
        var result = new RankingsResult
        {
            Season = 2024,
            Week = 1,
            Rankings = new List<RankedTeam>()
        };

        var dto = RankingsMapper.ToResponseDTO(result);

        Assert.Equal(2024, dto.Season);
        Assert.Equal(1, dto.Week);
        Assert.Empty(dto.Rankings);
    }

    [Fact]
    public void ToResponseDTO_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => RankingsMapper.ToResponseDTO(null!));
    }

    [Fact]
    public void ToResponseDTO_PreservesRankingOrder()
    {
        var result = new RankingsResult
        {
            Season = 2024,
            Week = 12,
            Rankings = new List<RankedTeam>
            {
                new() { Rank = 3, TeamName = "Texas", Details = new TeamDetails() },
                new() { Rank = 1, TeamName = "Georgia", Details = new TeamDetails() },
                new() { Rank = 2, TeamName = "Michigan", Details = new TeamDetails() }
            }
        };

        var dto = RankingsMapper.ToResponseDTO(result);

        var rankings = dto.Rankings.ToList();
        Assert.Equal("Texas", rankings[0].TeamName);
        Assert.Equal("Georgia", rankings[1].TeamName);
        Assert.Equal("Michigan", rankings[2].TeamName);
    }
}
