using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class WeekMapperTests
{
    [Fact]
    public void ToDTO_MapsAllProperties()
    {
        var weekInfo = new WeekInfo
        {
            WeekNumber = 5,
            Label = "Week 5"
        };

        var result = WeekMapper.ToDTO(weekInfo);

        Assert.Equal(5, result.WeekNumber);
        Assert.Equal("Week 5", result.Label);
    }

    [Fact]
    public void ToDTO_WithPostseasonLabel_MapsCorrectly()
    {
        var weekInfo = new WeekInfo
        {
            WeekNumber = 16,
            Label = "Postseason"
        };

        var result = WeekMapper.ToDTO(weekInfo);

        Assert.Equal(16, result.WeekNumber);
        Assert.Equal("Postseason", result.Label);
    }

    [Fact]
    public void ToDTO_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => WeekMapper.ToDTO(null!));
    }

    [Fact]
    public void ToResponseDTO_MapsSeasonAndWeeks()
    {
        var weeks = new List<WeekInfo>
        {
            new() { WeekNumber = 1, Label = "Week 1" },
            new() { WeekNumber = 2, Label = "Week 2" },
            new() { WeekNumber = 3, Label = "Week 3" }
        };

        var result = WeekMapper.ToResponseDTO(2024, weeks);

        Assert.Equal(2024, result.Season);
        var weekList = result.Weeks.ToList();
        Assert.Equal(3, weekList.Count);
        Assert.Equal(1, weekList[0].WeekNumber);
        Assert.Equal(2, weekList[1].WeekNumber);
        Assert.Equal(3, weekList[2].WeekNumber);
    }

    [Fact]
    public void ToResponseDTO_WithEmptyList_ReturnsEmptyWeeks()
    {
        var weeks = new List<WeekInfo>();

        var result = WeekMapper.ToResponseDTO(2024, weeks);

        Assert.Equal(2024, result.Season);
        Assert.Empty(result.Weeks);
    }

    [Fact]
    public void ToResponseDTO_WithNullWeeks_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => WeekMapper.ToResponseDTO(2024, null!));
    }

    [Fact]
    public void ToResponseDTO_PreservesWeekOrder()
    {
        var weeks = new List<WeekInfo>
        {
            new() { WeekNumber = 10, Label = "Week 10" },
            new() { WeekNumber = 5, Label = "Week 5" },
            new() { WeekNumber = 15, Label = "Week 15" }
        };

        var result = WeekMapper.ToResponseDTO(2024, weeks);

        var weekList = result.Weeks.ToList();
        Assert.Equal(10, weekList[0].WeekNumber);
        Assert.Equal(5, weekList[1].WeekNumber);
        Assert.Equal(15, weekList[2].WeekNumber);
    }
}
