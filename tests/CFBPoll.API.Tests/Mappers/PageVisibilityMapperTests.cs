using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class PageVisibilityMapperTests
{
    [Fact]
    public void ToDTO_MapsAllProperties()
    {
        var model = new PageVisibility
        {
            AllTimeEnabled = true,
            PollLeadersEnabled = false
        };

        var result = PageVisibilityMapper.ToDTO(model);

        Assert.True(result.AllTimeEnabled);
        Assert.False(result.PollLeadersEnabled);
    }

    [Fact]
    public void ToDTO_AllDisabled_MapsCorrectly()
    {
        var model = new PageVisibility
        {
            AllTimeEnabled = false,
            PollLeadersEnabled = false
        };

        var result = PageVisibilityMapper.ToDTO(model);

        Assert.False(result.AllTimeEnabled);
        Assert.False(result.PollLeadersEnabled);
    }

    [Fact]
    public void ToDTO_AllEnabled_MapsCorrectly()
    {
        var model = new PageVisibility
        {
            AllTimeEnabled = true,
            PollLeadersEnabled = true
        };

        var result = PageVisibilityMapper.ToDTO(model);

        Assert.True(result.AllTimeEnabled);
        Assert.True(result.PollLeadersEnabled);
    }

    [Fact]
    public void ToDTO_NullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => PageVisibilityMapper.ToDTO(null!));
    }

    [Fact]
    public void ToModel_MapsAllProperties()
    {
        var dto = new PageVisibilityDTO
        {
            AllTimeEnabled = false,
            PollLeadersEnabled = true
        };

        var result = PageVisibilityMapper.ToModel(dto);

        Assert.False(result.AllTimeEnabled);
        Assert.True(result.PollLeadersEnabled);
    }

    [Fact]
    public void ToModel_AllDisabled_MapsCorrectly()
    {
        var dto = new PageVisibilityDTO
        {
            AllTimeEnabled = false,
            PollLeadersEnabled = false
        };

        var result = PageVisibilityMapper.ToModel(dto);

        Assert.False(result.AllTimeEnabled);
        Assert.False(result.PollLeadersEnabled);
    }

    [Fact]
    public void ToModel_AllEnabled_MapsCorrectly()
    {
        var dto = new PageVisibilityDTO
        {
            AllTimeEnabled = true,
            PollLeadersEnabled = true
        };

        var result = PageVisibilityMapper.ToModel(dto);

        Assert.True(result.AllTimeEnabled);
        Assert.True(result.PollLeadersEnabled);
    }

    [Fact]
    public void ToModel_NullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => PageVisibilityMapper.ToModel(null!));
    }

    [Fact]
    public void ToDTO_ThenToModel_RoundTrips()
    {
        var original = new PageVisibility
        {
            AllTimeEnabled = true,
            PollLeadersEnabled = false
        };

        var dto = PageVisibilityMapper.ToDTO(original);
        var roundTripped = PageVisibilityMapper.ToModel(dto);

        Assert.Equal(original.AllTimeEnabled, roundTripped.AllTimeEnabled);
        Assert.Equal(original.PollLeadersEnabled, roundTripped.PollLeadersEnabled);
    }

    [Fact]
    public void ToModel_ThenToDTO_RoundTrips()
    {
        var original = new PageVisibilityDTO
        {
            AllTimeEnabled = false,
            PollLeadersEnabled = true
        };

        var model = PageVisibilityMapper.ToModel(original);
        var roundTripped = PageVisibilityMapper.ToDTO(model);

        Assert.Equal(original.AllTimeEnabled, roundTripped.AllTimeEnabled);
        Assert.Equal(original.PollLeadersEnabled, roundTripped.PollLeadersEnabled);
    }
}
