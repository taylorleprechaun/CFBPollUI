using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class RankingsControllerTests
{
    private readonly Mock<ICFBDataService> _mockDataService;
    private readonly Mock<ILogger<RankingsController>> _mockLogger;
    private readonly Mock<IRankingsModule> _mockRankingsModule;
    private readonly Mock<IRatingModule> _mockRatingModule;
    private readonly RankingsController _controller;

    public RankingsControllerTests()
    {
        _mockDataService = new Mock<ICFBDataService>();
        _mockLogger = new Mock<ILogger<RankingsController>>();
        _mockRankingsModule = new Mock<IRankingsModule>();
        _mockRatingModule = new Mock<IRatingModule>();

        _controller = new RankingsController(
            _mockDataService.Object,
            _mockRankingsModule.Object,
            _mockRatingModule.Object,
            _mockLogger.Object);
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

}
