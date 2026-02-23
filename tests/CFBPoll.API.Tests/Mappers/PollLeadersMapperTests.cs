using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class PollLeadersMapperTests
{
    [Fact]
    public void ToDTO_MapsAllProperties()
    {
        var entry = new PollLeaderEntry
        {
            LogoURL = "https://example.com/michigan.png",
            TeamName = "Michigan",
            Top5Count = 8,
            Top10Count = 15,
            Top25Count = 22
        };

        var result = PollLeadersMapper.ToDTO(entry);

        Assert.Equal("https://example.com/michigan.png", result.LogoURL);
        Assert.Equal("Michigan", result.TeamName);
        Assert.Equal(8, result.Top5Count);
        Assert.Equal(15, result.Top10Count);
        Assert.Equal(22, result.Top25Count);
    }

    [Fact]
    public void ToDTO_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => PollLeadersMapper.ToDTO(null!));
    }

    [Fact]
    public void ToDTO_WithDefaultValues_MapsCorrectly()
    {
        var entry = new PollLeaderEntry();

        var result = PollLeadersMapper.ToDTO(entry);

        Assert.Equal(string.Empty, result.LogoURL);
        Assert.Equal(string.Empty, result.TeamName);
        Assert.Equal(0, result.Top5Count);
        Assert.Equal(0, result.Top10Count);
        Assert.Equal(0, result.Top25Count);
    }

    [Fact]
    public void ToResponseDTO_MapsAllProperties()
    {
        var pollLeadersResult = new PollLeadersResult
        {
            AllWeeks = new List<PollLeaderEntry>
            {
                new()
                {
                    LogoURL = "https://example.com/alabama.png",
                    TeamName = "Alabama",
                    Top5Count = 10,
                    Top10Count = 18,
                    Top25Count = 25
                },
                new()
                {
                    LogoURL = "https://example.com/ohiostate.png",
                    TeamName = "Ohio State",
                    Top5Count = 7,
                    Top10Count = 12,
                    Top25Count = 20
                }
            },
            FinalWeeksOnly = new List<PollLeaderEntry>
            {
                new()
                {
                    LogoURL = "https://example.com/texas.png",
                    TeamName = "Texas",
                    Top5Count = 3,
                    Top10Count = 6,
                    Top25Count = 10
                }
            },
            MaxAvailableSeason = 2023,
            MinAvailableSeason = 2002
        };

        var dto = PollLeadersMapper.ToResponseDTO(pollLeadersResult);

        Assert.Equal(2, dto.AllWeeks.Count());
        Assert.Single(dto.FinalWeeksOnly);
        Assert.Equal(2002, dto.MinAvailableSeason);
        Assert.Equal(2023, dto.MaxAvailableSeason);

        var firstAllWeeks = dto.AllWeeks.First();
        Assert.Equal("Alabama", firstAllWeeks.TeamName);
        Assert.Equal(10, firstAllWeeks.Top5Count);
        Assert.Equal(18, firstAllWeeks.Top10Count);
        Assert.Equal(25, firstAllWeeks.Top25Count);

        var firstFinalWeeks = dto.FinalWeeksOnly.First();
        Assert.Equal("Texas", firstFinalWeeks.TeamName);
    }

    [Fact]
    public void ToResponseDTO_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => PollLeadersMapper.ToResponseDTO(null!));
    }

    [Fact]
    public void ToResponseDTO_WithEmptyLists_ReturnsEmptyLists()
    {
        var pollLeadersResult = new PollLeadersResult();

        var dto = PollLeadersMapper.ToResponseDTO(pollLeadersResult);

        Assert.Empty(dto.AllWeeks);
        Assert.Empty(dto.FinalWeeksOnly);
        Assert.Equal(0, dto.MinAvailableSeason);
        Assert.Equal(0, dto.MaxAvailableSeason);
    }

    [Fact]
    public void ToResponseDTO_PreservesOrder()
    {
        var pollLeadersResult = new PollLeadersResult
        {
            AllWeeks = new List<PollLeaderEntry>
            {
                new() { LogoURL = "https://example.com/first.png", TeamName = "Alabama", Top25Count = 30 },
                new() { LogoURL = "https://example.com/second.png", TeamName = "Ohio State", Top25Count = 25 },
                new() { LogoURL = "https://example.com/third.png", TeamName = "Michigan", Top25Count = 20 }
            },
            FinalWeeksOnly = new List<PollLeaderEntry>
            {
                new() { LogoURL = "https://example.com/f1.png", TeamName = "Texas", Top25Count = 15 },
                new() { LogoURL = "https://example.com/f2.png", TeamName = "Oklahoma", Top25Count = 10 }
            }
        };

        var dto = PollLeadersMapper.ToResponseDTO(pollLeadersResult);

        var allWeeks = dto.AllWeeks.ToList();
        Assert.Equal("Alabama", allWeeks[0].TeamName);
        Assert.Equal("Ohio State", allWeeks[1].TeamName);
        Assert.Equal("Michigan", allWeeks[2].TeamName);

        var finalWeeks = dto.FinalWeeksOnly.ToList();
        Assert.Equal("Texas", finalWeeks[0].TeamName);
        Assert.Equal("Oklahoma", finalWeeks[1].TeamName);
    }

    [Fact]
    public void ToResponseDTO_MultipleEntries_AllMappedCorrectly()
    {
        var pollLeadersResult = new PollLeadersResult
        {
            AllWeeks = new List<PollLeaderEntry>
            {
                new() { LogoURL = "https://example.com/a.png", TeamName = "Alabama", Top5Count = 10, Top10Count = 15, Top25Count = 20 },
                new() { LogoURL = "https://example.com/b.png", TeamName = "Florida", Top5Count = 5, Top10Count = 8, Top25Count = 12 },
                new() { LogoURL = "https://example.com/c.png", TeamName = "Iowa", Top5Count = 2, Top10Count = 4, Top25Count = 6 }
            },
            FinalWeeksOnly = []
        };

        var dto = PollLeadersMapper.ToResponseDTO(pollLeadersResult);

        var allWeeks = dto.AllWeeks.ToList();
        Assert.Equal(3, allWeeks.Count);

        Assert.Equal("Alabama", allWeeks[0].TeamName);
        Assert.Equal("https://example.com/a.png", allWeeks[0].LogoURL);
        Assert.Equal(10, allWeeks[0].Top5Count);

        Assert.Equal("Florida", allWeeks[1].TeamName);
        Assert.Equal("https://example.com/b.png", allWeeks[1].LogoURL);
        Assert.Equal(5, allWeeks[1].Top5Count);

        Assert.Equal("Iowa", allWeeks[2].TeamName);
        Assert.Equal("https://example.com/c.png", allWeeks[2].LogoURL);
        Assert.Equal(2, allWeeks[2].Top5Count);
    }
}
