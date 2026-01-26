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

public class RankingsControllerTests
{
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<IRatingModule> _mockRatingModule;
    private readonly Mock<IOptions<HistoricalDataOptions>> _mockOptions;
    private readonly Mock<ILogger<RankingsController>> _mockLogger;
    private readonly RankingsController _controller;

    public RankingsControllerTests()
    {
        _mockDataService = new Mock<ICFBDataService>();
        _mockRankingsModule = new Mock<IRankingsModule>();
        _mockRatingModule = new Mock<IRatingModule>();
        _mockOptions = new Mock<IOptions<HistoricalDataOptions>>();
        _mockLogger = new Mock<ILogger<RankingsController>>();

        _mockOptions.Setup(x => x.Value).Returns(new HistoricalDataOptions { MinimumYear = 2002 });

        _controller = new RankingsController(
            _mockDataService.Object,
            _mockRankingsModule.Object,
            _mockRatingModule.Object,
            _mockOptions.Object,
            _mockLogger.Object);
    }

    [Theory]
    [InlineData(2001)]
    [InlineData(1999)]
    public async Task GetRankings_InvalidSeasonBelowMinimum_ReturnsBadRequest(int season)
    {
        var result = await _controller.GetRankings(season, 1);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task GetRankings_SeasonTooFarInFuture_ReturnsBadRequest()
    {
        var futureYear = DateTime.Now.Year + 2;

        var result = await _controller.GetRankings(futureYear, 1);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task GetRankings_InvalidWeek_ReturnsBadRequest(int week)
    {
        var result = await _controller.GetRankings(2023, week);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetRankings_ValidRequest_ReturnsRankings()
    {
        var seasonData = new SeasonData
        {
            Season = 2023,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo
                {
                    Name = "Team A",
                    Conference = "Conference 1",
                    Division = "Division 1",
                    LogoURL = "https://example.com/logo.png",
                    Wins = 4,
                    Losses = 1,
                    Games = []
                }
            },
            Games = []
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 4,
                Losses = 1,
                StrengthOfSchedule = 0.5,
                WeightedStrengthOfSchedule = 0.6,
                RatingComponents = new Dictionary<string, double>
                {
                    ["BaseWins"] = 40,
                    ["MarginFactor"] = 5,
                    ["SOSBonus"] = 10
                }
            }
        };

        var rankingsResult = new RankingsResult
        {
            Season = 2023,
            Week = 5,
            Rankings = new List<RankedTeam>
            {
                new RankedTeam
                {
                    TeamName = "Team A",
                    Rank = 1,
                    Conference = "Conference 1",
                    Division = "Division 1",
                    LogoURL = "https://example.com/logo.png",
                    Wins = 4,
                    Losses = 1,
                    Rating = 55,
                    SOSRanking = 1,
                    WeightedSOS = 0.6,
                    Details = new TeamDetails()
                }
            }
        };

        _mockDataService
            .Setup(x => x.GetSeasonDataAsync(2023, 5))
            .ReturnsAsync(seasonData);

        _mockRatingModule
            .Setup(x => x.RateTeams(seasonData))
            .Returns(ratings);

        _mockRankingsModule
            .Setup(x => x.GenerateRankingsAsync(seasonData, ratings))
            .ReturnsAsync(rankingsResult);

        var result = await _controller.GetRankings(2023, 5);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RankingsResponseDTO>(okResult.Value);
        Assert.Equal(2023, response.Season);
        Assert.Equal(5, response.Week);
        var rankings = response.Rankings;
        Assert.Single(rankings);
        Assert.Equal("Team A", rankings.First().TeamName);
        Assert.Equal(1, rankings.First().Rank);
    }

    [Fact]
    public async Task GetRankings_UsesMinimumYearFromOptions()
    {
        var customOptions = new Mock<IOptions<HistoricalDataOptions>>();
        customOptions.Setup(x => x.Value).Returns(new HistoricalDataOptions { MinimumYear = 2010 });

        var controller = new RankingsController(
            _mockDataService.Object,
            _mockRankingsModule.Object,
            _mockRatingModule.Object,
            customOptions.Object,
            _mockLogger.Object);

        var result = await controller.GetRankings(2009, 1);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }
}
