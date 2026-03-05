using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class SeasonsControllerTests
{
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<ILogger<SeasonsController>> _mockLogger;
    private readonly Mock<IOptions<HistoricalDataOptions>> _mockOptions;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<ISeasonModule> _mockSeasonModule;
    private readonly SeasonsController _controller;

    public SeasonsControllerTests()
    {
        _mockDataService = new Mock<ICFBDataService>();
        _mockLogger = new Mock<ILogger<SeasonsController>>();
        _mockOptions = new Mock<IOptions<HistoricalDataOptions>>();
        _mockRankingsModule = new Mock<IRankingsModule>();
        _mockSeasonModule = new Mock<ISeasonModule>();

        _mockOptions.Setup(x => x.Value).Returns(new HistoricalDataOptions { MinimumYear = 2002 });

        _mockRankingsModule
            .Setup(x => x.GetPublishedWeekNumbersAsync(It.IsAny<int>()))
            .ReturnsAsync(Enumerable.Empty<int>());

        _controller = new SeasonsController(
            _mockDataService.Object,
            _mockRankingsModule.Object,
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
            _mockRankingsModule.Object,
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
    public async Task GetWeeks_ReturnsWeeksListWithRankingsPublished()
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
        _mockRankingsModule
            .Setup(x => x.GetPublishedWeekNumbersAsync(2023))
            .ReturnsAsync(new List<int> { 1, 3 });

        var result = await _controller.GetWeeks(2023);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<WeeksResponseDTO>(okResult.Value);

        Assert.Equal(2023, response.Season);
        var weeks = response.Weeks.ToList();
        Assert.Equal(3, weeks.Count);
        Assert.True(weeks[0].RankingsPublished);
        Assert.False(weeks[1].RankingsPublished);
        Assert.True(weeks[2].RankingsPublished);
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

    [Fact]
    public async Task GetWeeks_NoPublishedRankings_AllWeeksHaveRankingsPublishedFalse()
    {
        var calendar = new List<CalendarWeek>
        {
            new() { Week = 1, SeasonType = "regular", StartDate = DateTime.Now, EndDate = DateTime.Now },
            new() { Week = 2, SeasonType = "regular", StartDate = DateTime.Now, EndDate = DateTime.Now },
        };

        var weekInfos = new List<WeekInfo>
        {
            new() { WeekNumber = 1, Label = "Week 1" },
            new() { WeekNumber = 2, Label = "Week 2" }
        };

        _mockDataService.Setup(x => x.GetCalendarAsync(2023)).ReturnsAsync(calendar);
        _mockSeasonModule
            .Setup(x => x.GetWeekLabels(It.IsAny<IEnumerable<CalendarWeek>>()))
            .Returns(weekInfos);
        _mockRankingsModule
            .Setup(x => x.GetPublishedWeekNumbersAsync(2023))
            .ReturnsAsync(Enumerable.Empty<int>());

        var result = await _controller.GetWeeks(2023);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<WeeksResponseDTO>(okResult.Value);

        Assert.All(response.Weeks, w => Assert.False(w.RankingsPublished));
    }

    [Fact]
    public void Constructor_NullDataService_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonsController(
                null!,
                new Mock<IRankingsModule>().Object,
                new Mock<ISeasonModule>().Object,
                _mockOptions.Object,
                new Mock<ILogger<SeasonsController>>().Object));
    }

    [Fact]
    public void Constructor_NullRankingsModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonsController(
                new Mock<ICFBDataService>().Object,
                null!,
                new Mock<ISeasonModule>().Object,
                _mockOptions.Object,
                new Mock<ILogger<SeasonsController>>().Object));
    }

    [Fact]
    public void Constructor_NullSeasonModule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonsController(
                new Mock<ICFBDataService>().Object,
                new Mock<IRankingsModule>().Object,
                null!,
                _mockOptions.Object,
                new Mock<ILogger<SeasonsController>>().Object));
    }

    [Fact]
    public void Constructor_NullOptions_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonsController(
                new Mock<ICFBDataService>().Object,
                new Mock<IRankingsModule>().Object,
                new Mock<ISeasonModule>().Object,
                null!,
                new Mock<ILogger<SeasonsController>>().Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new SeasonsController(
                new Mock<ICFBDataService>().Object,
                new Mock<IRankingsModule>().Object,
                new Mock<ISeasonModule>().Object,
                _mockOptions.Object,
                null!));
    }
}
