using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class ConferencesControllerTests
{
    private readonly Mock<IConferenceModule> _mockConferenceModule;
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<ILogger<ConferencesController>> _mockLogger;
    private readonly ConferencesController _controller;

    public ConferencesControllerTests()
    {
        _mockConferenceModule = new Mock<IConferenceModule>();
        _mockDataService = new Mock<ICFBDataService>();
        _mockLogger = new Mock<ILogger<ConferencesController>>();

        _controller = new ConferencesController(
            _mockConferenceModule.Object,
            _mockDataService.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task GetConferences_ReturnsConferences()
    {
        var conferences = new List<Conference>
        {
            new Conference { ID = 1, Name = "Southeastern Conference", Abbreviation = "SEC", ShortName = "SEC" },
            new Conference { ID = 2, Name = "Big Ten Conference", Abbreviation = "B1G", ShortName = "Big Ten" }
        };

        var conferenceInfos = new List<ConferenceInfo>
        {
            new ConferenceInfo { ID = 1, Name = "Southeastern Conference", Label = "SEC" },
            new ConferenceInfo { ID = 2, Name = "Big Ten Conference", Label = "Big Ten" }
        };

        _mockDataService
            .Setup(x => x.GetConferencesAsync())
            .ReturnsAsync(conferences);

        _mockConferenceModule
            .Setup(x => x.GetConferenceInfos(conferences))
            .Returns(conferenceInfos);

        var result = await _controller.GetConferences();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ConferencesResponseDTO>(okResult.Value);
        var responseConferences = response.Conferences.ToList();
        Assert.Equal(2, responseConferences.Count);
        Assert.Equal("SEC", responseConferences[0].Label);
        Assert.Equal("Big Ten", responseConferences[1].Label);
    }

    [Fact]
    public async Task GetConferences_EmptyList_ReturnsEmptyConferences()
    {
        var conferences = new List<Conference>();
        var conferenceInfos = new List<ConferenceInfo>();

        _mockDataService
            .Setup(x => x.GetConferencesAsync())
            .ReturnsAsync(conferences);

        _mockConferenceModule
            .Setup(x => x.GetConferenceInfos(conferences))
            .Returns(conferenceInfos);

        var result = await _controller.GetConferences();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ConferencesResponseDTO>(okResult.Value);
        Assert.Empty(response.Conferences);
    }

    [Fact]
    public async Task GetConferences_SingleConference_ReturnsSingleConference()
    {
        var conferences = new List<Conference>
        {
            new Conference { ID = 1, Name = "Atlantic Coast Conference", Abbreviation = "ACC", ShortName = "ACC" }
        };

        var conferenceInfos = new List<ConferenceInfo>
        {
            new ConferenceInfo { ID = 1, Name = "Atlantic Coast Conference", Label = "ACC" }
        };

        _mockDataService
            .Setup(x => x.GetConferencesAsync())
            .ReturnsAsync(conferences);

        _mockConferenceModule
            .Setup(x => x.GetConferenceInfos(conferences))
            .Returns(conferenceInfos);

        var result = await _controller.GetConferences();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ConferencesResponseDTO>(okResult.Value);
        Assert.Single(response.Conferences);
        Assert.Equal(1, response.Conferences.First().ID);
        Assert.Equal("ACC", response.Conferences.First().Label);
        Assert.Equal("Atlantic Coast Conference", response.Conferences.First().Name);
    }

    [Fact]
    public async Task GetConferences_CallsDataServiceAndModule()
    {
        var conferences = new List<Conference>();
        var conferenceInfos = new List<ConferenceInfo>();

        _mockDataService
            .Setup(x => x.GetConferencesAsync())
            .ReturnsAsync(conferences);

        _mockConferenceModule
            .Setup(x => x.GetConferenceInfos(It.IsAny<IEnumerable<Conference>>()))
            .Returns(conferenceInfos);

        await _controller.GetConferences();

        _mockDataService.Verify(x => x.GetConferencesAsync(), Times.Once);
        _mockConferenceModule.Verify(x => x.GetConferenceInfos(conferences), Times.Once);
    }
}
