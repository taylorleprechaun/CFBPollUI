using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class RankingsModuleTests
{
    private readonly RankingsModule _rankingsModule;

    public RankingsModuleTests()
    {
        _rankingsModule = new RankingsModule();
    }

    [Fact]
    public void GenerateRankings_WithEmptyRatings_ReturnsEmptyRankings()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 1, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        Assert.Empty(result.Rankings);
        Assert.Equal(2024, result.Season);
        Assert.Equal(1, result.Week);
    }

    [Fact]
    public void GenerateRankings_SortsTeamsByTotalRating()
    {
        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Conference = "Conf1", Wins = 3, Losses = 1, Games = [] },
                ["Team B"] = new TeamInfo { Name = "Team B", Conference = "Conf2", Wins = 4, Losses = 0, Games = [] },
                ["Team C"] = new TeamInfo { Name = "Team C", Conference = "Conf1", Wins = 2, Losses = 2, Games = [] }
            }
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 3, Losses = 1, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 50 }
            },
            ["Team B"] = new RatingDetails
            {
                Wins = 4, Losses = 0, WeightedStrengthOfSchedule = 0.6,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 60 }
            },
            ["Team C"] = new RatingDetails
            {
                Wins = 2, Losses = 2, WeightedStrengthOfSchedule = 0.4,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 40 }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var rankedTeams = result.Rankings;
        Assert.Equal(3, rankedTeams.Count());
        Assert.Equal("Team B", rankedTeams.ElementAt(0).TeamName);
        Assert.Equal(1, rankedTeams.ElementAt(0).Rank);
        Assert.Equal("Team A", rankedTeams.ElementAt(1).TeamName);
        Assert.Equal(2, rankedTeams.ElementAt(1).Rank);
        Assert.Equal("Team C", rankedTeams.ElementAt(2).TeamName);
        Assert.Equal(3, rankedTeams.ElementAt(2).Rank);
    }

    [Fact]
    public void GenerateRankings_CalculatesSOSRanking()
    {
        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 3, Losses = 1, Games = [] },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 4, Losses = 0, Games = [] }
            }
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 3, Losses = 1, WeightedStrengthOfSchedule = 0.8,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 50 }
            },
            ["Team B"] = new RatingDetails
            {
                Wins = 4, Losses = 0, WeightedStrengthOfSchedule = 0.3,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 60 }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var rankedTeams = result.Rankings;
        var teamA = rankedTeams.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        var teamB = rankedTeams.First(t => t.TeamName.Equals("Team B", StringComparison.OrdinalIgnoreCase));

        Assert.Equal(1, teamA.SOSRanking);
        Assert.Equal(2, teamB.SOSRanking);
    }

    [Fact]
    public void GenerateRankings_IncludesTeamInfo()
    {
        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo
                {
                    Name = "Team A",
                    Conference = "Big Ten",
                    Division = "East",
                    LogoURL = "https://example.com/logo.png",
                    Wins = 4,
                    Losses = 1,
                    Games = []
                }
            }
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 4, Losses = 1, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 50 }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var team = result.Rankings.First();
        Assert.Equal("Big Ten", team.Conference);
        Assert.Equal("East", team.Division);
        Assert.Equal("https://example.com/logo.png", team.LogoURL);
    }

    [Fact]
    public void GenerateRankings_CalculatesLocationRecords()
    {
        var games = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 28, AwayPoints = 14, NeutralSite = false },
            new Game { HomeTeam = "Team B", AwayTeam = "Team A", HomePoints = 17, AwayPoints = 21, NeutralSite = false },
            new Game { HomeTeam = "Team A", AwayTeam = "Team C", HomePoints = 35, AwayPoints = 28, NeutralSite = true }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 3, Losses = 0, Games = games },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 0, Losses = 2, Games = [games[0], games[1]] },
                ["Team C"] = new TeamInfo { Name = "Team C", Wins = 0, Losses = 1, Games = [games[2]] }
            }
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 3, Losses = 0, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 60 }
            },
            ["Team B"] = new RatingDetails
            {
                Wins = 0, Losses = 2, WeightedStrengthOfSchedule = 0.4,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 30 }
            },
            ["Team C"] = new RatingDetails
            {
                Wins = 0, Losses = 1, WeightedStrengthOfSchedule = 0.3,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 20 }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.Home.Wins);
        Assert.Equal(0, teamA.Details.Home.Losses);
        Assert.Equal(1, teamA.Details.Away.Wins);
        Assert.Equal(0, teamA.Details.Away.Losses);
        Assert.Equal(1, teamA.Details.Neutral.Wins);
        Assert.Equal(0, teamA.Details.Neutral.Losses);
    }

    [Fact]
    public void GenerateRankings_CalculatesOpponentTierRecords()
    {
        var games = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 28, AwayPoints = 14 }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 1, Losses = 0, Games = games },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 0, Losses = 1, Games = games }
            }
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 1, Losses = 0, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 60 }
            },
            ["Team B"] = new RatingDetails
            {
                Wins = 0, Losses = 1, WeightedStrengthOfSchedule = 0.4,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 30 }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.VsRank1To10.Wins);
        Assert.Equal(0, teamA.Details.VsRank1To10.Losses);
    }

    [Fact]
    public void GenerateRankings_RoundsRatingToTwoDecimals()
    {
        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 1, Losses = 0, Games = [] }
            }
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 1, Losses = 0, WeightedStrengthOfSchedule = 0.55555,
                RatingComponents = new Dictionary<string, double>
                {
                    ["A"] = 33.3333,
                    ["B"] = 22.2222
                }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var team = result.Rankings.First();
        Assert.Equal(55.56, team.Rating);
        Assert.Equal(0.556, team.WeightedSOS);
    }

    [Fact]
    public void GenerateRankings_SkipsGamesWithNullPoints()
    {
        var games = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = null, AwayPoints = 14 },
            new Game { HomeTeam = "Team A", AwayTeam = "Team C", HomePoints = 28, AwayPoints = null },
            new Game { HomeTeam = "Team A", AwayTeam = "Team D", HomePoints = 28, AwayPoints = 14 }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 1, Losses = 0, Games = games }
            }
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 1, Losses = 0, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 50 }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var teamA = result.Rankings.First();
        Assert.Equal(1, teamA.Details.Home.Wins);
        Assert.Equal(0, teamA.Details.Home.Losses);
    }

    [Fact]
    public void GenerateRankings_HandlesTeamNotInSeasonData()
    {
        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>()
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Unknown Team"] = new RatingDetails
            {
                Wins = 1, Losses = 0, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 50 }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var team = result.Rankings.First();
        Assert.Equal("Unknown Team", team.TeamName);
        Assert.Equal(string.Empty, team.Conference);
        Assert.Equal(string.Empty, team.Division);
        Assert.Equal(string.Empty, team.LogoURL);
    }

    [Theory]
    [InlineData(11, 1, 0)]
    [InlineData(25, 1, 0)]
    public void GenerateRankings_TracksVsRank11To25(int opponentRank, int expectedWins, int expectedLosses)
    {
        var result = GenerateRankingsWithOpponentAtRank(opponentRank, true);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(expectedWins, teamA.Details.VsRank11To25.Wins);
        Assert.Equal(expectedLosses, teamA.Details.VsRank11To25.Losses);
    }

    [Theory]
    [InlineData(26, 1, 0)]
    [InlineData(50, 1, 0)]
    public void GenerateRankings_TracksVsRank26To50(int opponentRank, int expectedWins, int expectedLosses)
    {
        var result = GenerateRankingsWithOpponentAtRank(opponentRank, true);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(expectedWins, teamA.Details.VsRank26To50.Wins);
        Assert.Equal(expectedLosses, teamA.Details.VsRank26To50.Losses);
    }

    [Theory]
    [InlineData(51, 1, 0)]
    [InlineData(100, 1, 0)]
    public void GenerateRankings_TracksVsRank51To100(int opponentRank, int expectedWins, int expectedLosses)
    {
        var result = GenerateRankingsWithOpponentAtRank(opponentRank, true);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(expectedWins, teamA.Details.VsRank51To100.Wins);
        Assert.Equal(expectedLosses, teamA.Details.VsRank51To100.Losses);
    }

    [Theory]
    [InlineData(101, 1, 0)]
    [InlineData(150, 1, 0)]
    public void GenerateRankings_TracksVsRank101Plus(int opponentRank, int expectedWins, int expectedLosses)
    {
        var result = GenerateRankingsWithOpponentAtRank(opponentRank, true);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(expectedWins, teamA.Details.VsRank101Plus.Wins);
        Assert.Equal(expectedLosses, teamA.Details.VsRank101Plus.Losses);
    }

    [Fact]
    public void GenerateRankings_TracksLossesAgainstOpponentTiers()
    {
        var result = GenerateRankingsWithOpponentAtRank(5, false);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(0, teamA.Details.VsRank1To10.Wins);
        Assert.Equal(1, teamA.Details.VsRank1To10.Losses);
    }

    [Fact]
    public void GenerateRankings_UnrankedOpponentDefaultsToTier5()
    {
        var games = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Unranked Team", HomePoints = 28, AwayPoints = 14 }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 1, Losses = 0, Games = games }
            }
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 1, Losses = 0, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 50 }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var teamA = result.Rankings.First();
        Assert.Equal(1, teamA.Details.VsRank101Plus.Wins);
    }

    [Fact]
    public void GenerateRankings_TracksHomeLosses()
    {
        var games = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 14, AwayPoints = 28, NeutralSite = false }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 0, Losses = 1, Games = games },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 1, Losses = 0, Games = games }
            }
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 0, Losses = 1, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 30 }
            },
            ["Team B"] = new RatingDetails
            {
                Wins = 1, Losses = 0, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 50 }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(0, teamA.Details.Home.Wins);
        Assert.Equal(1, teamA.Details.Home.Losses);
    }

    [Fact]
    public void GenerateRankings_TracksAwayLosses()
    {
        var games = new List<Game>
        {
            new Game { HomeTeam = "Team B", AwayTeam = "Team A", HomePoints = 28, AwayPoints = 14, NeutralSite = false }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 0, Losses = 1, Games = games },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 1, Losses = 0, Games = games }
            }
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 0, Losses = 1, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 30 }
            },
            ["Team B"] = new RatingDetails
            {
                Wins = 1, Losses = 0, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 50 }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(0, teamA.Details.Away.Wins);
        Assert.Equal(1, teamA.Details.Away.Losses);
    }

    [Fact]
    public void GenerateRankings_TracksNeutralLosses()
    {
        var games = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 14, AwayPoints = 28, NeutralSite = true }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 0, Losses = 1, Games = games },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 1, Losses = 0, Games = games }
            }
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 0, Losses = 1, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 30 }
            },
            ["Team B"] = new RatingDetails
            {
                Wins = 1, Losses = 0, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 50 }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(0, teamA.Details.Neutral.Wins);
        Assert.Equal(1, teamA.Details.Neutral.Losses);
    }

    [Fact]
    public void GenerateRankings_HandlesCaseInsensitiveTeamNames()
    {
        var games = new List<Game>
        {
            new Game { HomeTeam = "TEAM A", AwayTeam = "team b", HomePoints = 28, AwayPoints = 14 }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Wins = 1, Losses = 0, Games = games },
                ["Team B"] = new TeamInfo { Name = "Team B", Wins = 0, Losses = 1, Games = games }
            }
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = 1, Losses = 0, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 50 }
            },
            ["Team B"] = new RatingDetails
            {
                Wins = 0, Losses = 1, WeightedStrengthOfSchedule = 0.4,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 30 }
            }
        };

        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.Home.Wins);
        Assert.Equal(1, teamA.Details.VsRank1To10.Wins);
    }

    private RankingsResult GenerateRankingsWithOpponentAtRank(int opponentRank, bool isWin)
    {
        var teamAPoints = isWin ? 28 : 14;
        var opponentPoints = isWin ? 14 : 28;

        var games = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Opponent", HomePoints = teamAPoints, AwayPoints = opponentPoints }
        };

        var teams = new Dictionary<string, TeamInfo>
        {
            ["Team A"] = new TeamInfo { Name = "Team A", Wins = isWin ? 1 : 0, Losses = isWin ? 0 : 1, Games = games },
            ["Opponent"] = new TeamInfo { Name = "Opponent", Wins = 0, Losses = 0, Games = [] }
        };

        for (var i = 2; i < opponentRank; i++)
        {
            var teamName = $"Filler{i}";
            teams[teamName] = new TeamInfo { Name = teamName, Wins = 0, Losses = 0, Games = [] };
        }

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = teams
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Wins = isWin ? 1 : 0, Losses = isWin ? 0 : 1, WeightedStrengthOfSchedule = 0.5,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 1000 }
            },
            ["Opponent"] = new RatingDetails
            {
                Wins = 0, Losses = 0, WeightedStrengthOfSchedule = 0.1,
                RatingComponents = new Dictionary<string, double> { ["Score"] = 1000 - opponentRank }
            }
        };

        for (var i = 2; i < opponentRank; i++)
        {
            var teamName = $"Filler{i}";
            var score = 1000 - i;
            ratings[teamName] = new RatingDetails
            {
                Wins = 0, Losses = 0, WeightedStrengthOfSchedule = 0.1,
                RatingComponents = new Dictionary<string, double> { ["Score"] = score }
            };
        }

        return _rankingsModule.GenerateRankings(seasonData, ratings);
    }
}
