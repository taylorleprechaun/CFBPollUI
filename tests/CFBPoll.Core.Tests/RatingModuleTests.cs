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
    public void RateTeams_WithNoGames_ReturnsRatingsWithZeroSOS()
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

        Assert.Single(ratings);
        Assert.True(ratings.ContainsKey("Team A"));
        Assert.Equal(0.0, ratings["Team A"].StrengthOfSchedule);
        Assert.Equal(0.0, ratings["Team A"].WeightedStrengthOfSchedule);
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

    [Fact]
    public void RateTeams_IgnoresGamesWithNullPoints()
    {
        var gamesA = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 28, AwayPoints = 14, Week = 1 },
            new Game { HomeTeam = "Team A", AwayTeam = "Team C", HomePoints = null, AwayPoints = null, Week = 2 }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 2,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 1, Losses = 0, Games = gamesA },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 0, Losses = 1, Games = [gamesA[0]] },
                ["Team C"] = new TeamInfo { Name = "Team C", Wins = 0, Losses = 0, Games = [] }
            },
            Games = gamesA
        };

        var ratings = _ratingModule.RateTeams(seasonData);

        Assert.Equal(0.0, ratings["Team A"].StrengthOfSchedule);
    }

    [Fact]
    public void RateTeams_CalculatesSOSForAwayTeam()
    {
        var game = new Game { HomeTeam = "Team B", AwayTeam = "Team A", HomePoints = 14, AwayPoints = 28, Week = 1 };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 1,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 1, Losses = 0, Games = [game] },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 0, Losses = 1, Games = [game] }
            },
            Games = [game]
        };

        var ratings = _ratingModule.RateTeams(seasonData);

        Assert.Equal(0.0, ratings["Team A"].StrengthOfSchedule);
        Assert.Equal(1.0, ratings["Team B"].StrengthOfSchedule);
    }

    [Fact]
    public void RateTeams_CalculatesWeightedSOSWithMultipleLevels()
    {
        var gameAB = new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 28, AwayPoints = 14, Week = 1 };
        var gameBC = new Game { HomeTeam = "Team B", AwayTeam = "Team C", HomePoints = 21, AwayPoints = 14, Week = 2 };
        var gameCD = new Game { HomeTeam = "Team C", AwayTeam = "Team D", HomePoints = 17, AwayPoints = 10, Week = 3 };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 3,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 1, Losses = 0, Games = [gameAB] },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 1, Losses = 1, Games = [gameAB, gameBC] },
                ["Team C"] = new TeamInfo { Name = "Team C", Wins = 1, Losses = 1, Games = [gameBC, gameCD] },
                ["Team D"] = new TeamInfo { Name = "Team D", Wins = 0, Losses = 1, Games = [gameCD] }
            },
            Games = [gameAB, gameBC, gameCD]
        };

        var ratings = _ratingModule.RateTeams(seasonData);

        Assert.True(ratings["Team A"].WeightedStrengthOfSchedule >= 0);
        Assert.True(ratings["Team A"].WeightedStrengthOfSchedule <= 1);
    }

    [Fact]
    public void RateTeams_HandlesOpponentNotInTeamsDictionary()
    {
        var game = new Game { HomeTeam = "Team A", AwayTeam = "Unknown Team", HomePoints = 28, AwayPoints = 14, Week = 1 };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 1,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 1, Losses = 0, Games = [game] }
            },
            Games = [game]
        };

        var ratings = _ratingModule.RateTeams(seasonData);

        Assert.Single(ratings);
        Assert.Equal(0.0, ratings["Team A"].StrengthOfSchedule);
    }
}
