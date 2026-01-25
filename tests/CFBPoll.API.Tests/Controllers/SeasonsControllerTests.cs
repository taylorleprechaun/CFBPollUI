using Xunit;
using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace CFBPoll.API.Tests.Controllers;

public class SeasonsControllerTests
{
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<ISeasonModule> _mockSeasonModule;
    private readonly Mock<IOptions<HistoricalDataOptions>> _mockOptions;
    private readonly Mock<ILogger<SeasonsController>> _mockLogger;
    private readonly SeasonsController _controller;

    public SeasonsControllerTests()
    {
        _mockDataService = new Mock<ICFBDataService>();
        _mockSeasonModule = new Mock<ISeasonModule>();
        _mockOptions = new Mock<IOptions<HistoricalDataOptions>>();
        _mockLogger = new Mock<ILogger<SeasonsController>>();

        _mockOptions.Setup(x => x.Value).Returns(new HistoricalDataOptions { MinimumYear = 2002 });

        _controller = new SeasonsController(
            _mockDataService.Object,
            _mockSeasonModule.Object,
            _mockOptions.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task GetSeasons_ReturnsSeasonsList()
    {
        _mockDataService.Setup(x => x.GetMaxSeasonYearAsync()).ReturnsAsync(2024);
        _mockSeasonModule
            .Setup(x => x.GetSeasonRange(2002, 2024))
            .Returns(Enumerable.Range(2002, 23).Reverse());

        var result = await _controller.GetSeasons();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<SeasonsResponseDTO>(okResult.Value);

        var seasons = response.Seasons;
        Assert.Equal(23, seasons.Count());
        Assert.Equal(2024, seasons.First());
        Assert.Equal(2002, seasons.Last());
    }

    [Fact]
    public async Task GetSeasons_UsesMinimumYearFromOptions()
    {
        var customOptions = new Mock<IOptions<HistoricalDataOptions>>();
        customOptions.Setup(x => x.Value).Returns(new HistoricalDataOptions { MinimumYear = 2015 });

        var controller = new SeasonsController(
            _mockDataService.Object,
            _mockSeasonModule.Object,
            customOptions.Object,
            _mockLogger.Object);

        _mockDataService.Setup(x => x.GetMaxSeasonYearAsync()).ReturnsAsync(2024);
        _mockSeasonModule
            .Setup(x => x.GetSeasonRange(2015, 2024))
            .Returns(Enumerable.Range(2015, 10).Reverse());

        var result = await controller.GetSeasons();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<SeasonsResponseDTO>(okResult.Value);

        var seasons = response.Seasons;
        Assert.Equal(10, seasons.Count());
        Assert.Equal(2015, seasons.Last());
    }

    [Fact]
    public async Task GetWeeks_ReturnsWeeksList()
    {
        var calendar = new List<CalendarWeek>
        {
            new() { Week = 1, SeasonType = "regular", StartDate = DateTime.Now, EndDate = DateTime.Now },
            new() { Week = 2, SeasonType = "regular", StartDate = DateTime.Now, EndDate = DateTime.Now },
            new() { Week = 3, SeasonType = "postseason", StartDate = DateTime.Now, EndDate = DateTime.Now },
        };

        var weekInfos = new List<WeekInfo>
        {
            new() { WeekNumber = 1, Label = "Week 1" },
            new() { WeekNumber = 2, Label = "Week 2" },
            new() { WeekNumber = 3, Label = "Postseason" }
        };

        _mockDataService.Setup(x => x.GetCalendarAsync(2023)).ReturnsAsync(calendar);
        _mockSeasonModule
            .Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(weekInfos);

        var result = await _controller.GetWeeks(2023);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<WeeksResponseDTO>(okResult.Value);

        Assert.Equal(2023, response.Season);
        Assert.Equal(3, response.Weeks.Count());
    }

    [Fact]
    public async Task GetWeeks_NoCalendarData_ReturnsNotFound()
    {
        _mockDataService.Setup(x => x.GetCalendarAsync(2023)).ReturnsAsync(new List<CalendarWeek>());

        var result = await _controller.GetWeeks(2023);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetWeeks_PostseasonWeek_HasCorrectLabel()
    {
        var calendar = new List<CalendarWeek>
        {
            new() { Week = 15, SeasonType = "regular", StartDate = DateTime.Now, EndDate = DateTime.Now },
            new() { Week = 16, SeasonType = "postseason", StartDate = DateTime.Now, EndDate = DateTime.Now },
        };

        var weekInfos = new List<WeekInfo>
        {
            new() { WeekNumber = 15, Label = "Week 15" },
            new() { WeekNumber = 16, Label = "Postseason" }
        };

        _mockDataService.Setup(x => x.GetCalendarAsync(2023)).ReturnsAsync(calendar);
        _mockSeasonModule
            .Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(weekInfos);

        var result = await _controller.GetWeeks(2023);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<WeeksResponseDTO>(okResult.Value);

        var weeks = response.Weeks;
        Assert.Equal("Week 15", weeks.ElementAt(0).Label);
        Assert.Equal("Postseason", weeks.ElementAt(1).Label);
    }
}
