using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class ConferenceModuleTests
{
    private readonly ConferenceModule _conferenceModule;

    public ConferenceModuleTests()
    {
        _conferenceModule = new ConferenceModule();
    }

    [Fact]
    public void GetConferenceInfos_WithAbbreviation_UsesAbbreviationAsLabel()
    {
        var conferences = new List<Conference>
        {
            new Conference { ID = 1, Name = "Big Ten Conference", Abbreviation = "B1G", ShortName = "Big Ten" }
        };

        var result = _conferenceModule.GetConferenceInfos(conferences);

        Assert.Single(result);
        Assert.Equal(1, result.First().ID);
        Assert.Equal("Big Ten Conference", result.First().Name);
        Assert.Equal("B1G", result.First().Label);
    }

    [Fact]
    public void GetConferenceInfos_WithoutAbbreviation_UsesShortNameAsLabel()
    {
        var conferences = new List<Conference>
        {
            new Conference { ID = 1, Name = "Big Ten Conference", Abbreviation = "", ShortName = "Big Ten" }
        };

        var result = _conferenceModule.GetConferenceInfos(conferences);

        Assert.Single(result);
        Assert.Equal("Big Ten", result.First().Label);
    }

    [Fact]
    public void GetConferenceInfos_WithNullAbbreviation_UsesShortNameAsLabel()
    {
        var conferences = new List<Conference>
        {
            new Conference { ID = 1, Name = "Big Ten Conference", Abbreviation = null!, ShortName = "Big Ten" }
        };

        var result = _conferenceModule.GetConferenceInfos(conferences);

        Assert.Single(result);
        Assert.Equal("Big Ten", result.First().Label);
    }

    [Fact]
    public void GetConferenceInfos_WithMultipleConferences_TransformsAll()
    {
        var conferences = new List<Conference>
        {
            new Conference { ID = 1, Name = "Big Ten Conference", Abbreviation = "B1G", ShortName = "Big Ten" },
            new Conference { ID = 2, Name = "Southeastern Conference", Abbreviation = "SEC", ShortName = "SEC" },
            new Conference { ID = 3, Name = "Atlantic Coast Conference", Abbreviation = "", ShortName = "ACC" }
        };

        var result = _conferenceModule.GetConferenceInfos(conferences);

        Assert.Equal(3, result.Count());
        Assert.Equal("B1G", result.ElementAt(0).Label);
        Assert.Equal("SEC", result.ElementAt(1).Label);
        Assert.Equal("ACC", result.ElementAt(2).Label);
    }

    [Fact]
    public void GetConferenceInfos_WithEmptyList_ReturnsEmptyList()
    {
        var conferences = new List<Conference>();

        var result = _conferenceModule.GetConferenceInfos(conferences);

        Assert.Empty(result);
    }

    [Fact]
    public void GetConferenceInfos_PreservesID()
    {
        var conferences = new List<Conference>
        {
            new Conference { ID = 42, Name = "Test Conference", Abbreviation = "TEST", ShortName = "Test" }
        };

        var result = _conferenceModule.GetConferenceInfos(conferences);

        Assert.Equal(42, result.First().ID);
    }

    [Fact]
    public void GetConferenceInfos_PreservesName()
    {
        var conferences = new List<Conference>
        {
            new Conference { ID = 1, Name = "Full Conference Name", Abbreviation = "FCN", ShortName = "FCN" }
        };

        var result = _conferenceModule.GetConferenceInfos(conferences);

        Assert.Equal("Full Conference Name", result.First().Name);
    }
}
