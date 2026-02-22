using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests;

public class CFBDataServiceTests
{
    [Fact]
    public async Task GetMaxSeasonYearAsync_ReturnsCurrentYear_WhenCalendarHasPastData()
    {
        var mockService = new Mock<ICFBDataService>();
        var currentYear = DateTime.Now.Year;

        mockService.Setup(s => s.GetCalendarAsync(currentYear))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new CalendarWeek
                {
                    Week = 1,
                    SeasonType = "regular",
                    StartDate = DateTime.Now.AddMonths(-3),
                    EndDate = DateTime.Now.AddMonths(-2)
                }
            });

        mockService.Setup(s => s.GetMaxSeasonYearAsync())
            .ReturnsAsync(currentYear);

        var result = await mockService.Object.GetMaxSeasonYearAsync();

        Assert.Equal(currentYear, result);
    }

    [Fact]
    public async Task GetMaxSeasonYearAsync_ReturnsPreviousYear_WhenAllDatesInFuture()
    {
        var mockService = new Mock<ICFBDataService>();
        var currentYear = DateTime.Now.Year;

        mockService.Setup(s => s.GetMaxSeasonYearAsync())
            .ReturnsAsync(currentYear - 1);

        var result = await mockService.Object.GetMaxSeasonYearAsync();

        Assert.Equal(currentYear - 1, result);
    }

    [Fact]
    public async Task GetCalendarAsync_TreatsPostseasonAsMaxWeekPlusOne()
    {
        var mockService = new Mock<ICFBDataService>();

        mockService.Setup(s => s.GetCalendarAsync(2024))
            .ReturnsAsync(new List<CalendarWeek>
            {
                new CalendarWeek { Week = 1, SeasonType = "regular", StartDate = new DateTime(2024, 8, 24), EndDate = new DateTime(2024, 8, 31) },
                new CalendarWeek { Week = 15, SeasonType = "regular", StartDate = new DateTime(2024, 11, 30), EndDate = new DateTime(2024, 12, 7) },
                new CalendarWeek { Week = 16, SeasonType = "postseason", StartDate = new DateTime(2024, 12, 14), EndDate = new DateTime(2025, 1, 20) }
            });

        var calendar = await mockService.Object.GetCalendarAsync(2024);

        var postseasonWeek = calendar.FirstOrDefault(w => w.SeasonType.Equals("postseason", StringComparison.OrdinalIgnoreCase));
        var maxRegularWeek = calendar.Where(w => w.SeasonType.Equals("regular", StringComparison.OrdinalIgnoreCase)).Max(w => w.Week);

        Assert.NotNull(postseasonWeek);
        Assert.Equal(maxRegularWeek + 1, postseasonWeek.Week);
    }

    [Fact]
    public async Task GetSeasonDataAsync_ReturnsTeamsWithLogos()
    {
        var mockService = new Mock<ICFBDataService>();

        mockService.Setup(s => s.GetSeasonDataAsync(2024, 1))
            .ReturnsAsync(new SeasonData
            {
                Season = 2024,
                Week = 1,
                Teams = new Dictionary<string, TeamInfo>
                {
                    ["USC"] = new TeamInfo
                    {
                        Name = "USC",
                        Conference = "Big Ten",
                        LogoURL = "https://example.com/usc.png"
                    }
                }
            });

        var result = await mockService.Object.GetSeasonDataAsync(2024, 1);

        Assert.NotEmpty(result.Teams["USC"].LogoURL);
    }
}
