using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class AllTimeMapperTests
{
    [Fact]
    public void ToDTO_MapsAllProperties()
    {
        var entry = new AllTimeEntry
        {
            AllTimeRank = 1,
            LogoURL = "https://example.com/florida.png",
            Losses = 2,
            Rank = 3,
            Rating = 55.1234,
            Season = 2023,
            TeamName = "Florida",
            WeightedSOS = 0.7890,
            Week = 5,
            Wins = 11
        };

        var result = AllTimeMapper.ToDTO(entry);

        Assert.Equal(1, result.AllTimeRank);
        Assert.Equal("https://example.com/florida.png", result.LogoURL);
        Assert.Equal(2, result.Losses);
        Assert.Equal(3, result.Rank);
        Assert.Equal(55.1234, result.Rating);
        Assert.Equal(2023, result.Season);
        Assert.Equal("Florida", result.TeamName);
        Assert.Equal(0.7890, result.WeightedSOS);
        Assert.Equal(5, result.Week);
        Assert.Equal(11, result.Wins);
    }

    [Fact]
    public void ToDTO_ComputesRecordString()
    {
        var entry = new AllTimeEntry
        {
            Wins = 11,
            Losses = 2
        };

        var result = AllTimeMapper.ToDTO(entry);

        Assert.Equal("11-2", result.Record);
    }

    [Fact]
    public void ToDTO_WithZeroRecord_ComputesCorrectly()
    {
        var entry = new AllTimeEntry
        {
            Wins = 0,
            Losses = 0
        };

        var result = AllTimeMapper.ToDTO(entry);

        Assert.Equal("0-0", result.Record);
    }

    [Fact]
    public void ToDTO_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => AllTimeMapper.ToDTO(null!));
    }

    [Fact]
    public void ToResponseDTO_MapsAllLists()
    {
        var result = new AllTimeResult
        {
            BestTeams = new List<AllTimeEntry>
            {
                new() { AllTimeRank = 1, LogoURL = "https://example.com/best.png", TeamName = "Best", Wins = 12, Losses = 0 },
                new() { AllTimeRank = 2, LogoURL = "https://example.com/second.png", TeamName = "Second", Wins = 11, Losses = 1 }
            },
            HardestSchedules = new List<AllTimeEntry>
            {
                new() { AllTimeRank = 1, LogoURL = "https://example.com/hard.png", TeamName = "Hard SOS", Wins = 8, Losses = 4 }
            },
            WorstTeams = new List<AllTimeEntry>
            {
                new() { AllTimeRank = 1, LogoURL = "https://example.com/worst.png", TeamName = "Worst", Wins = 0, Losses = 12 }
            }
        };

        var dto = AllTimeMapper.ToResponseDTO(result);

        Assert.Equal(2, dto.BestTeams.Count());
        Assert.Equal("Best", dto.BestTeams.First().TeamName);
        Assert.Equal("12-0", dto.BestTeams.First().Record);

        Assert.Single(dto.HardestSchedules);
        Assert.Equal("Hard SOS", dto.HardestSchedules.First().TeamName);

        Assert.Single(dto.WorstTeams);
        Assert.Equal("Worst", dto.WorstTeams.First().TeamName);
        Assert.Equal("0-12", dto.WorstTeams.First().Record);
    }

    [Fact]
    public void ToResponseDTO_WithEmptyLists_ReturnsEmptyLists()
    {
        var result = new AllTimeResult();

        var dto = AllTimeMapper.ToResponseDTO(result);

        Assert.Empty(dto.BestTeams);
        Assert.Empty(dto.HardestSchedules);
        Assert.Empty(dto.WorstTeams);
    }

    [Fact]
    public void ToResponseDTO_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => AllTimeMapper.ToResponseDTO(null!));
    }

    [Fact]
    public void ToResponseDTO_PreservesOrder()
    {
        var result = new AllTimeResult
        {
            BestTeams = new List<AllTimeEntry>
            {
                new() { AllTimeRank = 1, LogoURL = "https://example.com/first.png", TeamName = "First", Wins = 12, Losses = 0 },
                new() { AllTimeRank = 2, LogoURL = "https://example.com/second.png", TeamName = "Second", Wins = 11, Losses = 1 },
                new() { AllTimeRank = 3, LogoURL = "https://example.com/third.png", TeamName = "Third", Wins = 10, Losses = 2 }
            },
            HardestSchedules = [],
            WorstTeams = []
        };

        var dto = AllTimeMapper.ToResponseDTO(result);

        var bestTeams = dto.BestTeams.ToList();
        Assert.Equal("First", bestTeams[0].TeamName);
        Assert.Equal("Second", bestTeams[1].TeamName);
        Assert.Equal("Third", bestTeams[2].TeamName);
    }
}
