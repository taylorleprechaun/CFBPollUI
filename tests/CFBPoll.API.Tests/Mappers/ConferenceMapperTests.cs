using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class ConferenceMapperTests
{
    [Fact]
    public void ToDTO_MapsAllProperties()
    {
        var conferenceInfo = new ConferenceInfo
        {
            ID = 1,
            Label = "SEC",
            Name = "Southeastern Conference"
        };

        var result = ConferenceMapper.ToDTO(conferenceInfo);

        Assert.Equal(1, result.ID);
        Assert.Equal("SEC", result.Label);
        Assert.Equal("Southeastern Conference", result.Name);
    }

    [Fact]
    public void ToDTO_WithEmptyStrings_MapsEmptyStrings()
    {
        var conferenceInfo = new ConferenceInfo
        {
            ID = 0,
            Label = string.Empty,
            Name = string.Empty
        };

        var result = ConferenceMapper.ToDTO(conferenceInfo);

        Assert.Equal(0, result.ID);
        Assert.Equal(string.Empty, result.Label);
        Assert.Equal(string.Empty, result.Name);
    }

    [Fact]
    public void ToDTO_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => ConferenceMapper.ToDTO(null!));
    }

    [Fact]
    public void ToResponseDTO_MapsMultipleConferences()
    {
        var conferences = new List<ConferenceInfo>
        {
            new() { ID = 1, Label = "SEC", Name = "Southeastern Conference" },
            new() { ID = 2, Label = "B1G", Name = "Big Ten Conference" },
            new() { ID = 3, Label = "ACC", Name = "Atlantic Coast Conference" }
        };

        var result = ConferenceMapper.ToResponseDTO(conferences);

        var conferenceList = result.Conferences.ToList();
        Assert.Equal(3, conferenceList.Count);
        Assert.Equal("SEC", conferenceList[0].Label);
        Assert.Equal("B1G", conferenceList[1].Label);
        Assert.Equal("ACC", conferenceList[2].Label);
    }

    [Fact]
    public void ToResponseDTO_WithEmptyList_ReturnsEmptyConferences()
    {
        var conferences = new List<ConferenceInfo>();

        var result = ConferenceMapper.ToResponseDTO(conferences);

        Assert.Empty(result.Conferences);
    }

    [Fact]
    public void ToResponseDTO_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => ConferenceMapper.ToResponseDTO(null!));
    }
}
