using CFBPoll.Core.Models;
using CFBPoll.Core.Services;
using Xunit;

namespace CFBPoll.Core.Tests.Services;

public class SeasonDataAssemblerTests
{
    [Fact]
    public void FilterGamesToWeek_FiltersRegularGamesCorrectly()
    {
        var regularGames = new List<Game>
        {
            new Game { GameID = 1, Week = 1, HomeTeam = "A", AwayTeam = "B", HomePoints = 28, AwayPoints = 14, SeasonType = "regular" },
            new Game { GameID = 2, Week = 3, HomeTeam = "C", AwayTeam = "D", HomePoints = 21, AwayPoints = 17, SeasonType = "regular" },
            new Game { GameID = 3, Week = 5, HomeTeam = "E", AwayTeam = "F", HomePoints = 35, AwayPoints = 10, SeasonType = "regular" }
        };
        var postseasonGames = new List<Game>
        {
            new Game { GameID = 4, Week = 16, HomeTeam = "A", AwayTeam = "C", HomePoints = 31, AwayPoints = 28, SeasonType = "postseason" }
        };

        var result = SeasonDataAssembler.FilterGamesToWeek(regularGames, postseasonGames, 3, 15).ToList();

        Assert.Equal(2, result.Count);
        Assert.All(result, g => Assert.True(g.Week <= 3));
    }

    [Fact]
    public void FilterGamesToWeek_IncludesPostseason_WhenWeekExceedsMaxRegular()
    {
        var regularGames = new List<Game>
        {
            new Game { GameID = 1, Week = 1, HomeTeam = "A", AwayTeam = "B", HomePoints = 28, AwayPoints = 14, SeasonType = "regular" }
        };
        var postseasonGames = new List<Game>
        {
            new Game { GameID = 2, Week = 16, HomeTeam = "C", AwayTeam = "D", HomePoints = 31, AwayPoints = 28, SeasonType = "postseason" }
        };

        var result = SeasonDataAssembler.FilterGamesToWeek(regularGames, postseasonGames, 16, 15).ToList();

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void FilterGamesToWeek_ExcludesPostseason_WhenWeekIsRegular()
    {
        var regularGames = new List<Game>
        {
            new Game { GameID = 1, Week = 1, HomeTeam = "A", AwayTeam = "B", HomePoints = 28, AwayPoints = 14, SeasonType = "regular" }
        };
        var postseasonGames = new List<Game>
        {
            new Game { GameID = 2, Week = 16, HomeTeam = "C", AwayTeam = "D", HomePoints = 31, AwayPoints = 28, SeasonType = "postseason" }
        };

        var result = SeasonDataAssembler.FilterGamesToWeek(regularGames, postseasonGames, 5, 15).ToList();

        Assert.Single(result);
        Assert.Equal("regular", result[0].SeasonType);
    }

    [Fact]
    public void FilterGamesToWeek_HandlesEmptyCollections()
    {
        var result = SeasonDataAssembler.FilterGamesToWeek([], [], 5, 15).ToList();

        Assert.Empty(result);
    }

    [Fact]
    public void AttachAdvancedStats_MatchesByTeamAndGameID()
    {
        var games = new List<Game>
        {
            new Game { GameID = 100, Week = 1, HomeTeam = "Alabama", AwayTeam = "Georgia", HomePoints = 28, AwayPoints = 24, SeasonType = "regular" }
        };
        var regularStats = new List<AdvancedGameStats>
        {
            new AdvancedGameStats { GameID = 100, Team = "Alabama", Offense = new AdvancedGameStatsUnit { PPA = 0.25 } },
            new AdvancedGameStats { GameID = 100, Team = "Georgia", Defense = new AdvancedGameStatsUnit { PPA = -0.15 } }
        };

        var result = SeasonDataAssembler.AttachAdvancedStats(games, regularStats, [], 1, 15).ToList();

        Assert.Single(result);
        Assert.NotNull(result[0].HomeAdvancedStats);
        Assert.Equal(0.25, result[0].HomeAdvancedStats!.Offense!.PPA);
        Assert.NotNull(result[0].AwayAdvancedStats);
        Assert.Equal(-0.15, result[0].AwayAdvancedStats!.Defense!.PPA);
    }

    [Fact]
    public void AttachAdvancedStats_DoesNotMutateInputGames()
    {
        var originalGame = new Game { GameID = 100, Week = 1, HomeTeam = "Alabama", AwayTeam = "Georgia", HomePoints = 28, AwayPoints = 24, SeasonType = "regular" };
        var games = new List<Game> { originalGame };
        var regularStats = new List<AdvancedGameStats>
        {
            new AdvancedGameStats { GameID = 100, Team = "Alabama", Offense = new AdvancedGameStatsUnit { PPA = 0.25 } }
        };

        SeasonDataAssembler.AttachAdvancedStats(games, regularStats, [], 1, 15);

        Assert.Null(originalGame.HomeAdvancedStats);
    }

    [Fact]
    public void AttachAdvancedStats_HandlesMissingStats()
    {
        var games = new List<Game>
        {
            new Game { GameID = 100, Week = 1, HomeTeam = "Alabama", AwayTeam = "Georgia", HomePoints = 28, AwayPoints = 24, SeasonType = "regular" }
        };

        var result = SeasonDataAssembler.AttachAdvancedStats(games, [], [], 1, 15).ToList();

        Assert.Single(result);
        Assert.Null(result[0].HomeAdvancedStats);
        Assert.Null(result[0].AwayAdvancedStats);
    }

    [Fact]
    public void AttachAdvancedStats_HandlesNullGameID()
    {
        var games = new List<Game>
        {
            new Game { GameID = null, Week = 1, HomeTeam = "Alabama", AwayTeam = "Georgia", HomePoints = 28, AwayPoints = 24, SeasonType = "regular" }
        };
        var regularStats = new List<AdvancedGameStats>
        {
            new AdvancedGameStats { GameID = 100, Team = "Alabama", Offense = new AdvancedGameStatsUnit { PPA = 0.25 } }
        };

        var result = SeasonDataAssembler.AttachAdvancedStats(games, regularStats, [], 1, 15).ToList();

        Assert.Single(result);
        Assert.Null(result[0].HomeAdvancedStats);
    }

    [Fact]
    public void BuildTeamDictionary_CalculatesCorrectRecords()
    {
        var teams = new List<FBSTeam>
        {
            new FBSTeam { Name = "Alabama", Conference = "SEC", Color = "#9E1B32" },
            new FBSTeam { Name = "Georgia", Conference = "SEC", Color = "#BA0C2F" }
        };
        var games = new List<Game>
        {
            new Game { GameID = 1, HomeTeam = "Alabama", AwayTeam = "Georgia", HomePoints = 28, AwayPoints = 24, SeasonType = "regular" }
        };
        var stats = new Dictionary<string, IEnumerable<TeamStat>>();

        var result = SeasonDataAssembler.BuildTeamDictionary(teams, games, stats);

        Assert.Equal(2, result.Count);
        Assert.Equal(1, result["Alabama"].Wins);
        Assert.Equal(0, result["Alabama"].Losses);
        Assert.Equal(0, result["Georgia"].Wins);
        Assert.Equal(1, result["Georgia"].Losses);
    }

    [Fact]
    public void BuildTeamDictionary_AttachesStats()
    {
        var teams = new List<FBSTeam>
        {
            new FBSTeam { Name = "Alabama", Conference = "SEC" }
        };
        var games = new List<Game>();
        var stats = new Dictionary<string, IEnumerable<TeamStat>>
        {
            ["Alabama"] = new List<TeamStat> { new TeamStat { StatName = "rushingYards", StatValue = new StatValue { Double = 250.0 } } }
        };

        var result = SeasonDataAssembler.BuildTeamDictionary(teams, games, stats);

        Assert.Single(result["Alabama"].TeamStats);
    }

    [Fact]
    public void BuildTeamDictionary_SkipsEmptyNames()
    {
        var teams = new List<FBSTeam>
        {
            new FBSTeam { Name = "", Conference = "SEC" },
            new FBSTeam { Name = "Alabama", Conference = "SEC" }
        };

        var result = SeasonDataAssembler.BuildTeamDictionary(teams, [], new Dictionary<string, IEnumerable<TeamStat>>());

        Assert.Single(result);
        Assert.True(result.ContainsKey("Alabama"));
    }

    [Fact]
    public void BuildTeamDictionary_SetsTeamMetadata()
    {
        var teams = new List<FBSTeam>
        {
            new FBSTeam { Name = "Alabama", AltColor = "#FFFFFF", Color = "#9E1B32", Conference = "SEC", Division = "West", LogoURL = "https://logo.png" }
        };

        var result = SeasonDataAssembler.BuildTeamDictionary(teams, [], new Dictionary<string, IEnumerable<TeamStat>>());

        var team = result["Alabama"];
        Assert.Equal("#FFFFFF", team.AltColor);
        Assert.Equal("#9E1B32", team.Color);
        Assert.Equal("SEC", team.Conference);
        Assert.Equal("West", team.Division);
        Assert.Equal("https://logo.png", team.LogoURL);
    }

    [Fact]
    public void Assemble_ProducesCorrectSeasonData()
    {
        var teams = new List<FBSTeam>
        {
            new FBSTeam { Name = "Alabama", Conference = "SEC" },
            new FBSTeam { Name = "Georgia", Conference = "SEC" }
        };
        var regularGames = new List<Game>
        {
            new Game { GameID = 1, Week = 1, HomeTeam = "Alabama", AwayTeam = "Georgia", HomePoints = 28, AwayPoints = 24, SeasonType = "regular" },
            new Game { GameID = 2, Week = 5, HomeTeam = "Georgia", AwayTeam = "Alabama", HomePoints = 35, AwayPoints = 31, SeasonType = "regular" }
        };
        var postseasonGames = new List<Game>();
        var regularAdvancedStats = new List<AdvancedGameStats>();
        var postseasonAdvancedStats = new List<AdvancedGameStats>();
        var seasonStats = new Dictionary<string, IEnumerable<TeamStat>>();

        var result = SeasonDataAssembler.Assemble(
            2024, 3, teams, regularGames, postseasonGames,
            regularAdvancedStats, postseasonAdvancedStats, seasonStats);

        Assert.Equal(2024, result.Season);
        Assert.Equal(3, result.Week);
        Assert.Equal(2, result.Teams.Count);
        Assert.Single(result.Games);
        Assert.Equal(1, result.Teams["Alabama"].Wins);
        Assert.Equal(0, result.Teams["Alabama"].Losses);
    }

    [Fact]
    public void Assemble_IncludesPostseasonGames_WhenApplicable()
    {
        var teams = new List<FBSTeam>
        {
            new FBSTeam { Name = "Alabama" },
            new FBSTeam { Name = "Georgia" }
        };
        var regularGames = new List<Game>
        {
            new Game { GameID = 1, Week = 1, HomeTeam = "Alabama", AwayTeam = "Georgia", HomePoints = 28, AwayPoints = 24, SeasonType = "regular" }
        };
        var postseasonGames = new List<Game>
        {
            new Game { GameID = 2, Week = 16, HomeTeam = "Georgia", AwayTeam = "Alabama", HomePoints = 35, AwayPoints = 31, SeasonType = "postseason" }
        };

        var result = SeasonDataAssembler.Assemble(
            2024, 16, teams, regularGames, postseasonGames, [], [], new Dictionary<string, IEnumerable<TeamStat>>());

        Assert.Equal(2, result.Games.Count());
    }
}
