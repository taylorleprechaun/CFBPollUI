using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Xunit;

namespace CFBPoll.Core.Tests;

public class RatingModuleTests
{
    private readonly RatingModule _ratingModule;

    public RatingModuleTests()
    {
        _ratingModule = new RatingModule();
    }

    [Fact]
    public void RateTeams_WithNoGames_ReturnsEmptyRatings()
    {
        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 1,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 0, Losses = 0, Games = [] }
            },
            Games = []
        };

        var ratings = _ratingModule.RateTeams(seasonData);

        Assert.Empty(ratings);
    }

    [Fact]
    public void RateTeams_CalculatesBaseWinPointsCorrectly()
    {
        var games = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 28, AwayPoints = 14, Week = 1 }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 1,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 1, Losses = 0, Games = games },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 0, Losses = 1, Games = games }
            },
            Games = games
        };

        var ratings = _ratingModule.RateTeams(seasonData);

        Assert.True(ratings.ContainsKey("Team A"));
        Assert.Equal(10.0, ratings["Team A"].RatingComponents["BaseWinPoints"]);
        Assert.Equal(0.0, ratings["Team B"].RatingComponents["BaseWinPoints"]);
    }

    [Fact]
    public void RateTeams_CalculatesSOSCorrectly()
    {
        var gamesA = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 28, AwayPoints = 14, Week = 1 }
        };

        var gamesB = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 28, AwayPoints = 14, Week = 1 }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 1,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 1, Losses = 0, Games = gamesA },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 0, Losses = 1, Games = gamesB }
            },
            Games = gamesA
        };

        var ratings = _ratingModule.RateTeams(seasonData);

        Assert.Equal(0.0, ratings["Team A"].StrengthOfSchedule);
        Assert.Equal(1.0, ratings["Team B"].StrengthOfSchedule);
    }

    [Fact]
    public void RateTeams_CapsMarginAt21Points()
    {
        var games = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 70, AwayPoints = 0, Week = 1 }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 1,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 1, Losses = 0, Games = games },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 0, Losses = 1, Games = games }
            },
            Games = games
        };

        var ratings = _ratingModule.RateTeams(seasonData);

        Assert.Equal(10.5, ratings["Team A"].RatingComponents["MarginFactor"]);
        Assert.Equal(-10.5, ratings["Team B"].RatingComponents["MarginFactor"]);
    }

    [Fact]
    public void RateTeams_RecordsWinsAndLosses()
    {
        var games = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 28, AwayPoints = 14, Week = 1 },
            new Game { HomeTeam = "Team A", AwayTeam = "Team C", HomePoints = 35, AwayPoints = 21, Week = 2 }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 2,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 2, Losses = 0, Games = games },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 0, Losses = 1, Games = [games[0]] },
                ["Team C"] = new TeamInfo { Name = "Team C", Wins = 0, Losses = 1, Games = [games[1]] }
            },
            Games = games
        };

        var ratings = _ratingModule.RateTeams(seasonData);

        Assert.Equal(2, ratings["Team A"].Wins);
        Assert.Equal(0, ratings["Team A"].Losses);
        Assert.Equal(0, ratings["Team B"].Wins);
        Assert.Equal(1, ratings["Team B"].Losses);
    }
}
