using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Services;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Services;

public class TeamLogoLookupTests
{
    [Fact]
    public async Task GetTeamLogosByNameAsync_DuplicateTeamNamesDifferingByCase_ReturnsOneEntryPerName()
    {
        var mockDataService = new Mock<ICFBDataService>();
        mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync([
                new FBSTeam { Name = "Iowa", LogoURL = "https://example.com/iowa-1.png" },
                new FBSTeam { Name = "IOWA", LogoURL = "https://example.com/iowa-2.png" }
            ]);

        var result = await TeamLogoLookup.GetTeamLogosByNameAsync(mockDataService.Object, 2024);

        Assert.Single(result);
    }

    [Fact]
    public async Task GetTeamLogosByNameAsync_EmptyTeamList_ReturnsEmptyLookup()
    {
        var mockDataService = new Mock<ICFBDataService>();
        mockDataService.Setup(x => x.GetFBSTeamsAsync(2024)).ReturnsAsync([]);

        var result = await TeamLogoLookup.GetTeamLogosByNameAsync(mockDataService.Object, 2024);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetTeamLogosByNameAsync_MatchesTeamNameCaseInsensitively()
    {
        var mockDataService = new Mock<ICFBDataService>();
        mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync([new FBSTeam { Name = "Nebraska", LogoURL = "https://example.com/nebraska.png" }]);

        var result = await TeamLogoLookup.GetTeamLogosByNameAsync(mockDataService.Object, 2024);

        Assert.Equal("https://example.com/nebraska.png", result["NEBRASKA"]);
    }

    [Fact]
    public async Task GetTeamLogosByNameAsync_ReturnsLookupKeyedByTeamName()
    {
        var mockDataService = new Mock<ICFBDataService>();
        mockDataService.Setup(x => x.GetFBSTeamsAsync(2024))
            .ReturnsAsync([
                new FBSTeam { Name = "Oklahoma", LogoURL = "https://example.com/oklahoma.png" },
                new FBSTeam { Name = "Texas", LogoURL = "https://example.com/texas.png" }
            ]);

        var result = await TeamLogoLookup.GetTeamLogosByNameAsync(mockDataService.Object, 2024);

        Assert.Equal("https://example.com/oklahoma.png", result["Oklahoma"]);
        Assert.Equal("https://example.com/texas.png", result["Texas"]);
    }

    [Fact]
    public void WithTeamLogos_GameOverride_TeamNotInLookup_LeavesLogoURLNull()
    {
        var gameOverride = new GameOverride { AwayTeam = "Iowa", HomeTeam = "Nebraska" };
        var teamLogosByName = new Dictionary<string, string>();

        var result = TeamLogoLookup.WithTeamLogos(gameOverride, teamLogosByName);

        Assert.Null(result.AwayTeamLogoURL);
        Assert.Null(result.HomeTeamLogoURL);
    }

    [Fact]
    public void WithTeamLogos_GameOverride_TeamsInLookup_MapsLogoURLs()
    {
        var gameOverride = new GameOverride
        {
            AwayTeam = "Iowa",
            GameID = 401234561,
            HomeTeam = "Nebraska",
            Reason = "A targeting call was missed on the game-deciding play.",
            Season = 2024,
            SeasonType = "regular",
            Week = 3
        };
        var teamLogosByName = new Dictionary<string, string>
        {
            ["Iowa"] = "https://example.com/iowa.png",
            ["Nebraska"] = "https://example.com/nebraska.png"
        };

        var result = TeamLogoLookup.WithTeamLogos(gameOverride, teamLogosByName);

        Assert.Equal("https://example.com/iowa.png", result.AwayTeamLogoURL);
        Assert.Equal("https://example.com/nebraska.png", result.HomeTeamLogoURL);
        Assert.Equal("A targeting call was missed on the game-deciding play.", result.Reason);
    }

    [Fact]
    public void WithTeamLogos_ScheduleGame_TeamNotInLookup_LeavesLogoURLNull()
    {
        var scheduleGame = new ScheduleGame { AwayTeam = "Oklahoma", HomeTeam = "Texas" };
        var teamLogosByName = new Dictionary<string, string>();

        var result = TeamLogoLookup.WithTeamLogos(scheduleGame, teamLogosByName);

        Assert.Null(result.AwayTeamLogoURL);
        Assert.Null(result.HomeTeamLogoURL);
    }

    [Fact]
    public void WithTeamLogos_ScheduleGame_TeamsInLookup_MapsLogoURLs()
    {
        var scheduleGame = new ScheduleGame
        {
            AwayPoints = 20,
            AwayTeam = "Oklahoma",
            GameID = 401234561,
            HomePoints = 24,
            HomeTeam = "Texas",
            SeasonType = "regular"
        };
        var teamLogosByName = new Dictionary<string, string>
        {
            ["Oklahoma"] = "https://example.com/oklahoma.png",
            ["Texas"] = "https://example.com/texas.png"
        };

        var result = TeamLogoLookup.WithTeamLogos(scheduleGame, teamLogosByName);

        Assert.Equal("https://example.com/oklahoma.png", result.AwayTeamLogoURL);
        Assert.Equal("https://example.com/texas.png", result.HomeTeamLogoURL);
    }
}
