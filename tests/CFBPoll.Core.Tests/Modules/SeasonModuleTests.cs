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
    public void GetSeasonRange_WithLargeRange_ReturnsAllYears()
    {
        var result = _seasonModule.GetSeasonRange(2002, 2024);

        Assert.Equal(23, result.Count());
        Assert.Equal(2024, result.First());
        Assert.Equal(2002, result.Last());
    }

    [Fact]
    public void GetSeasonRange_WithSingleYear_ReturnsSingleYear()
    {
        var result = _seasonModule.GetSeasonRange(2024, 2024);

        Assert.Single(result);
        Assert.Equal(2024, result.First());
    }

    [Fact]
    public void GetWeekLabels_PreservesWeekNumber()
    {
        var calendarWeeks = new List<CalendarWeek>
        {
            new() { Week = 10, SeasonType = "regular" },
            new() { Week = 11, SeasonType = "postseason" }
        };

        var result = _seasonModule.GetWeekLabels(calendarWeeks, []);

        Assert.Equal(10, result.ElementAt(0).WeekNumber);
        Assert.Equal(11, result.ElementAt(1).WeekNumber);
    }

    [Fact]
    public void GetWeekLabels_WithCompleteWeek_SetsIsCompleteTrue()
    {
        var calendarWeeks = new List<CalendarWeek> { new() { Week = 1, SeasonType = "regular" } };
        var scheduleGames = new List<ScheduleGame>
        {
            new() { Week = 1, SeasonType = "regular", HomeTeam = "Iowa", AwayTeam = "Nebraska", Completed = true }
        };

        var result = _seasonModule.GetWeekLabels(calendarWeeks, scheduleGames);

        Assert.True(result.ElementAt(0).IsComplete);
    }

    [Fact]
    public void GetWeekLabels_WithEmptyList_ReturnsEmptyList()
    {
        var calendarWeeks = new List<CalendarWeek>();

        var result = _seasonModule.GetWeekLabels(calendarWeeks, []);

        Assert.Empty(result);
    }

    [Fact]
    public void GetWeekLabels_WithIncompleteWeek_SetsIsCompleteFalse()
    {
        var calendarWeeks = new List<CalendarWeek> { new() { Week = 1, SeasonType = "regular" } };
        var scheduleGames = new List<ScheduleGame>
        {
            new() { Week = 1, SeasonType = "regular", HomeTeam = "Michigan", AwayTeam = "Ohio State", Completed = false }
        };

        var result = _seasonModule.GetWeekLabels(calendarWeeks, scheduleGames);

        Assert.False(result.ElementAt(0).IsComplete);
    }

    [Fact]
    public void GetWeekLabels_WithPostseasonCaseInsensitive_ReturnsPostseasonLabel()
    {
        var calendarWeeks = new List<CalendarWeek>
        {
            new() { Week = 16, SeasonType = "POSTSEASON" },
            new() { Week = 17, SeasonType = "Postseason" }
        };

        var result = _seasonModule.GetWeekLabels(calendarWeeks, []);

        Assert.Equal("Postseason", result.ElementAt(0).Label);
        Assert.Equal("Postseason", result.ElementAt(1).Label);
    }

    [Fact]
    public void GetWeekLabels_WithPostseasonWeek_ReturnsPostseasonLabel()
    {
        var calendarWeeks = new List<CalendarWeek>
        {
            new() { Week = 15, SeasonType = "regular" },
            new() { Week = 16, SeasonType = "postseason" }
        };

        var result = _seasonModule.GetWeekLabels(calendarWeeks, []);

        Assert.Equal(2, result.Count());
        Assert.Equal("Week 16", result.ElementAt(0).Label);
        Assert.Equal("Postseason", result.ElementAt(1).Label);
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

        var result = _seasonModule.GetWeekLabels(calendarWeeks, []);

        Assert.Equal(3, result.Count());
        Assert.Equal("Week 2", result.ElementAt(0).Label);
        Assert.Equal(1, result.ElementAt(0).WeekNumber);
        Assert.Equal("Week 3", result.ElementAt(1).Label);
        Assert.Equal(2, result.ElementAt(1).WeekNumber);
        Assert.Equal("Week 4", result.ElementAt(2).Label);
        Assert.Equal(3, result.ElementAt(2).WeekNumber);
    }

    [Fact]
    public void IsWeekComplete_PostseasonWithAllGamesCompleted_ReturnsTrue()
    {
        var scheduleGames = new List<ScheduleGame>
        {
            new() { Week = 16, SeasonType = "postseason", HomeTeam = "Texas", AwayTeam = "Oklahoma", Completed = true },
            new() { Week = 17, SeasonType = "postseason", HomeTeam = "Alabama", AwayTeam = "Florida", Completed = true }
        };

        var result = _seasonModule.IsWeekComplete(16, "postseason", scheduleGames);

        Assert.True(result);
    }

    [Fact]
    public void IsWeekComplete_PostseasonWithIncompleteGame_ReturnsFalse()
    {
        var scheduleGames = new List<ScheduleGame>
        {
            new() { Week = 16, SeasonType = "postseason", HomeTeam = "Notre Dame", AwayTeam = "USC", Completed = true },
            new() { Week = 17, SeasonType = "postseason", HomeTeam = "Iowa", AwayTeam = "Nebraska", Completed = false }
        };

        var result = _seasonModule.IsWeekComplete(16, "postseason", scheduleGames);

        Assert.False(result);
    }

    [Fact]
    public void IsWeekComplete_RegularWeekCaseInsensitiveSeasonType_MatchesGames()
    {
        var scheduleGames = new List<ScheduleGame>
        {
            new() { Week = 1, SeasonType = "REGULAR", HomeTeam = "Michigan", AwayTeam = "Ohio State", Completed = true }
        };

        var result = _seasonModule.IsWeekComplete(1, "Regular", scheduleGames);

        Assert.True(result);
    }

    [Fact]
    public void IsWeekComplete_RegularWeekWithAllGamesCompleted_ReturnsTrue()
    {
        var scheduleGames = new List<ScheduleGame>
        {
            new() { Week = 1, SeasonType = "regular", HomeTeam = "Texas", AwayTeam = "Oklahoma", Completed = true },
            new() { Week = 1, SeasonType = "regular", HomeTeam = "Alabama", AwayTeam = "Florida", Completed = true },
            new() { Week = 2, SeasonType = "regular", HomeTeam = "Iowa", AwayTeam = "Nebraska", Completed = false }
        };

        var result = _seasonModule.IsWeekComplete(1, "regular", scheduleGames);

        Assert.True(result);
    }

    [Fact]
    public void IsWeekComplete_RegularWeekWithIncompleteGame_ReturnsFalse()
    {
        var scheduleGames = new List<ScheduleGame>
        {
            new() { Week = 1, SeasonType = "regular", HomeTeam = "Notre Dame", AwayTeam = "USC", Completed = true },
            new() { Week = 1, SeasonType = "regular", HomeTeam = "Michigan", AwayTeam = "Ohio State", Completed = false }
        };

        var result = _seasonModule.IsWeekComplete(1, "regular", scheduleGames);

        Assert.False(result);
    }

    [Fact]
    public void IsWeekComplete_WithNoMatchingGames_ReturnsFalse()
    {
        var scheduleGames = new List<ScheduleGame>
        {
            new() { Week = 2, SeasonType = "regular", HomeTeam = "Texas", AwayTeam = "Oklahoma", Completed = true }
        };

        var result = _seasonModule.IsWeekComplete(1, "regular", scheduleGames);

        Assert.False(result);
    }
}
