using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class SeasonModuleTests
{
    private readonly SeasonModule _seasonModule;

    public SeasonModuleTests()
    {
        _seasonModule = new SeasonModule();
    }

    [Fact]
    public void GetSeasonRange_ReturnsYearsInDescendingOrder()
    {
        var result = _seasonModule.GetSeasonRange(2020, 2024);

        Assert.Equal(5, result.Count());
        Assert.Equal(2024, result.ElementAt(0));
        Assert.Equal(2023, result.ElementAt(1));
        Assert.Equal(2022, result.ElementAt(2));
        Assert.Equal(2021, result.ElementAt(3));
        Assert.Equal(2020, result.ElementAt(4));
    }

    [Fact]
    public void GetSeasonRange_WithSingleYear_ReturnsSingleYear()
    {
        var result = _seasonModule.GetSeasonRange(2024, 2024);

        Assert.Single(result);
        Assert.Equal(2024, result.First());
    }

    [Fact]
    public void GetSeasonRange_WithLargeRange_ReturnsAllYears()
    {
        var result = _seasonModule.GetSeasonRange(2002, 2024);

        Assert.Equal(23, result.Count());
        Assert.Equal(2024, result.First());
        Assert.Equal(2002, result.Last());
    }

    [Fact]
    public void GetWeekLabels_WithRegularWeeks_ReturnsWeekLabels()
    {
        var calendarWeeks = new List<CalendarWeek>
        {
            new() { Week = 1, SeasonType = "regular" },
            new() { Week = 2, SeasonType = "regular" },
            new() { Week = 3, SeasonType = "regular" }
        };

        var result = _seasonModule.GetWeekLabels(calendarWeeks);

        Assert.Equal(3, result.Count());
        Assert.Equal("Week 1", result.ElementAt(0).Label);
        Assert.Equal(1, result.ElementAt(0).WeekNumber);
        Assert.Equal("Week 2", result.ElementAt(1).Label);
        Assert.Equal(2, result.ElementAt(1).WeekNumber);
        Assert.Equal("Week 3", result.ElementAt(2).Label);
        Assert.Equal(3, result.ElementAt(2).WeekNumber);
    }

    [Fact]
    public void GetWeekLabels_WithPostseasonWeek_ReturnsPostseasonLabel()
    {
        var calendarWeeks = new List<CalendarWeek>
        {
            new() { Week = 15, SeasonType = "regular" },
            new() { Week = 16, SeasonType = "postseason" }
        };

        var result = _seasonModule.GetWeekLabels(calendarWeeks);

        Assert.Equal(2, result.Count());
        Assert.Equal("Week 15", result.ElementAt(0).Label);
        Assert.Equal("Postseason", result.ElementAt(1).Label);
    }

    [Fact]
    public void GetWeekLabels_WithPostseasonCaseInsensitive_ReturnsPostseasonLabel()
    {
        var calendarWeeks = new List<CalendarWeek>
        {
            new() { Week = 16, SeasonType = "POSTSEASON" },
            new() { Week = 17, SeasonType = "Postseason" }
        };

        var result = _seasonModule.GetWeekLabels(calendarWeeks);

        Assert.Equal("Postseason", result.ElementAt(0).Label);
        Assert.Equal("Postseason", result.ElementAt(1).Label);
    }

    [Fact]
    public void GetWeekLabels_WithEmptyList_ReturnsEmptyList()
    {
        var calendarWeeks = new List<CalendarWeek>();

        var result = _seasonModule.GetWeekLabels(calendarWeeks);

        Assert.Empty(result);
    }

    [Fact]
    public void GetWeekLabels_PreservesWeekNumber()
    {
        var calendarWeeks = new List<CalendarWeek>
        {
            new() { Week = 10, SeasonType = "regular" },
            new() { Week = 11, SeasonType = "postseason" }
        };

        var result = _seasonModule.GetWeekLabels(calendarWeeks);

        Assert.Equal(10, result.ElementAt(0).WeekNumber);
        Assert.Equal(11, result.ElementAt(1).WeekNumber);
    }
}
