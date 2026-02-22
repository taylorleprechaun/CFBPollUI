using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class RankingsModuleTests
{
    private readonly Mock<IRankingsData> _mockRankingsData;
    private readonly Mock<ISeasonModule> _mockSeasonModule;
    private readonly RankingsModule _rankingsModule;

    public RankingsModuleTests()
    {
        _mockRankingsData = new Mock<IRankingsData>();
        _mockSeasonModule = new Mock<ISeasonModule>();

        _rankingsModule = new RankingsModule(_mockRankingsData.Object, _mockSeasonModule.Object);
    }

    [Fact]
    public async Task GenerateRankingsAsync_WithEmptyRatings_ReturnsEmptyRankings()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        Assert.Empty(result.Rankings);
    }

    [Fact]
    public async Task GenerateRankingsAsync_SetsSeasonAndWeekFromSeasonData()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 12, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>();

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        Assert.Equal(2024, result.Season);
        Assert.Equal(12, result.Week);
    }

    [Fact]
    public async Task GenerateRankingsAsync_SortsTeamsByRatingDescending()
    {
        var seasonData = CreateSeasonDataWithTeams("Team A", "Team B", "Team C");
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = CreateRatingDetails(rating: 75.5),
            ["Team B"] = CreateRatingDetails(rating: 90.2),
            ["Team C"] = CreateRatingDetails(rating: 60.0)
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var rankedTeams = result.Rankings.ToList();
        Assert.Equal("Team B", rankedTeams[0].TeamName);
        Assert.Equal("Team A", rankedTeams[1].TeamName);
        Assert.Equal("Team C", rankedTeams[2].TeamName);
    }

    [Fact]
    public async Task GenerateRankingsAsync_AssignsSequentialRanks()
    {
        var seasonData = CreateSeasonDataWithTeams("Team A", "Team B", "Team C");
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = CreateRatingDetails(rating: 75.5),
            ["Team B"] = CreateRatingDetails(rating: 90.2),
            ["Team C"] = CreateRatingDetails(rating: 60.0)
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var rankedTeams = result.Rankings.ToList();
        Assert.Equal(1, rankedTeams[0].Rank);
        Assert.Equal(2, rankedTeams[1].Rank);
        Assert.Equal(3, rankedTeams[2].Rank);
    }

    [Fact]
    public async Task GenerateRankingsAsync_MapsTeamInfoProperties()
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
                    Games = []
                }
            }
        };
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = CreateRatingDetails(rating: 80.0, wins: 5, losses: 2)
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var team = result.Rankings.First();
        Assert.Equal("Big Ten", team.Conference);
        Assert.Equal("East", team.Division);
        Assert.Equal("https://example.com/logo.png", team.LogoURL);
        Assert.Equal(5, team.Wins);
        Assert.Equal(2, team.Losses);
    }

    [Fact]
    public async Task GenerateRankingsAsync_WhenTeamNotInSeasonData_UsesEmptyDefaults()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Unknown Team"] = CreateRatingDetails(rating: 50.0)
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var team = result.Rankings.First();
        Assert.Equal("Unknown Team", team.TeamName);
        Assert.Equal(string.Empty, team.Conference);
        Assert.Equal(string.Empty, team.Division);
        Assert.Equal(string.Empty, team.LogoURL);
    }

    [Fact]
    public async Task GenerateRankingsAsync_RoundsRatingToFourDecimals()
    {
        var seasonData = CreateSeasonDataWithTeams("Team A");
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = CreateRatingDetails(rating: 85.123456789)
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        Assert.Equal(85.1235, result.Rankings.First().Rating);
    }

    [Fact]
    public async Task GenerateRankingsAsync_RoundsWeightedSOSToFourDecimals()
    {
        var seasonData = CreateSeasonDataWithTeams("Team A");
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = CreateRatingDetails(rating: 80.0, weightedSOS: 0.567891234)
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        Assert.Equal(0.5679, result.Rankings.First().WeightedSOS);
    }

    [Fact]
    public async Task GenerateRankingsAsync_CalculatesSOSRankingByWeightedSOS()
    {
        var seasonData = CreateSeasonDataWithTeams("Team A", "Team B", "Team C");
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = CreateRatingDetails(rating: 90.0, weightedSOS: 0.5),
            ["Team B"] = CreateRatingDetails(rating: 80.0, weightedSOS: 0.8),
            ["Team C"] = CreateRatingDetails(rating: 70.0, weightedSOS: 0.3)
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        var teamB = result.Rankings.First(t => t.TeamName.Equals("Team B", StringComparison.OrdinalIgnoreCase));
        var teamC = result.Rankings.First(t => t.TeamName.Equals("Team C", StringComparison.OrdinalIgnoreCase));

        Assert.Equal(1, teamB.SOSRanking);
        Assert.Equal(2, teamA.SOSRanking);
        Assert.Equal(3, teamC.SOSRanking);
    }

    [Fact]
    public async Task GenerateRankingsAsync_TracksHomeWins()
    {
        var game = new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 28, AwayPoints = 14, NeutralSite = false };
        var seasonData = CreateSeasonDataWithGames("Team A", [game]);
        var ratings = CreateRatingsForTeams(("Team A", 90.0), ("Team B", 80.0));

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.Home.Wins);
        Assert.Equal(0, teamA.Details.Home.Losses);
    }

    [Fact]
    public async Task GenerateRankingsAsync_TracksHomeLosses()
    {
        var game = new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 14, AwayPoints = 28, NeutralSite = false };
        var seasonData = CreateSeasonDataWithGames("Team A", [game]);
        var ratings = CreateRatingsForTeams(("Team A", 90.0), ("Team B", 80.0));

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(0, teamA.Details.Home.Wins);
        Assert.Equal(1, teamA.Details.Home.Losses);
    }

    [Fact]
    public async Task GenerateRankingsAsync_TracksAwayWins()
    {
        var game = new Game { HomeTeam = "Team B", AwayTeam = "Team A", HomePoints = 14, AwayPoints = 28, NeutralSite = false };
        var seasonData = CreateSeasonDataWithGames("Team A", [game]);
        var ratings = CreateRatingsForTeams(("Team A", 90.0), ("Team B", 80.0));

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.Away.Wins);
        Assert.Equal(0, teamA.Details.Away.Losses);
    }

    [Fact]
    public async Task GenerateRankingsAsync_TracksAwayLosses()
    {
        var game = new Game { HomeTeam = "Team B", AwayTeam = "Team A", HomePoints = 28, AwayPoints = 14, NeutralSite = false };
        var seasonData = CreateSeasonDataWithGames("Team A", [game]);
        var ratings = CreateRatingsForTeams(("Team A", 90.0), ("Team B", 80.0));

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(0, teamA.Details.Away.Wins);
        Assert.Equal(1, teamA.Details.Away.Losses);
    }

    [Fact]
    public async Task GenerateRankingsAsync_TracksNeutralSiteWins()
    {
        var game = new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 28, AwayPoints = 14, NeutralSite = true };
        var seasonData = CreateSeasonDataWithGames("Team A", [game]);
        var ratings = CreateRatingsForTeams(("Team A", 90.0), ("Team B", 80.0));

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.Neutral.Wins);
        Assert.Equal(0, teamA.Details.Neutral.Losses);
        Assert.Equal(0, teamA.Details.Home.Wins);
    }

    [Fact]
    public async Task GenerateRankingsAsync_TracksNeutralSiteLosses()
    {
        var game = new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 14, AwayPoints = 28, NeutralSite = true };
        var seasonData = CreateSeasonDataWithGames("Team A", [game]);
        var ratings = CreateRatingsForTeams(("Team A", 90.0), ("Team B", 80.0));

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(0, teamA.Details.Neutral.Wins);
        Assert.Equal(1, teamA.Details.Neutral.Losses);
    }

    [Fact]
    public async Task GenerateRankingsAsync_SkipsGamesWithNullHomePoints()
    {
        var game = new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = null, AwayPoints = 14, NeutralSite = false };
        var seasonData = CreateSeasonDataWithGames("Team A", [game]);
        var ratings = CreateRatingsForTeams(("Team A", 90.0), ("Team B", 80.0));

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(0, teamA.Details.Home.Wins);
        Assert.Equal(0, teamA.Details.Home.Losses);
    }

    [Fact]
    public async Task GenerateRankingsAsync_SkipsGamesWithNullAwayPoints()
    {
        var game = new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 28, AwayPoints = null, NeutralSite = false };
        var seasonData = CreateSeasonDataWithGames("Team A", [game]);
        var ratings = CreateRatingsForTeams(("Team A", 90.0), ("Team B", 80.0));

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(0, teamA.Details.Home.Wins);
        Assert.Equal(0, teamA.Details.Home.Losses);
    }

    [Fact]
    public async Task GenerateRankingsAsync_HandlesCaseInsensitiveTeamNameMatching()
    {
        var game = new Game { HomeTeam = "TEAM A", AwayTeam = "team b", HomePoints = 28, AwayPoints = 14, NeutralSite = false };
        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Games = [game] },
                ["Team B"] = new TeamInfo { Name = "Team B", Games = [] }
            }
        };
        var ratings = CreateRatingsForTeams(("Team A", 90.0), ("Team B", 80.0));

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.Home.Wins);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(10)]
    public async Task GenerateRankingsAsync_TracksWinsVsRank1To10(int opponentRank)
    {
        var result = await GenerateRankingsWithOpponentAtRankAsync(opponentRank, isWin: true);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.VsRank1To10.Wins);
        Assert.Equal(0, teamA.Details.VsRank1To10.Losses);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(10)]
    public async Task GenerateRankingsAsync_TracksLossesVsRank1To10(int opponentRank)
    {
        var result = await GenerateRankingsWithOpponentAtRankAsync(opponentRank, isWin: false);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(0, teamA.Details.VsRank1To10.Wins);
        Assert.Equal(1, teamA.Details.VsRank1To10.Losses);
    }

    [Theory]
    [InlineData(11)]
    [InlineData(20)]
    [InlineData(25)]
    public async Task GenerateRankingsAsync_TracksWinsVsRank11To25(int opponentRank)
    {
        var result = await GenerateRankingsWithOpponentAtRankAsync(opponentRank, isWin: true);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.VsRank11To25.Wins);
        Assert.Equal(0, teamA.Details.VsRank11To25.Losses);
    }

    [Theory]
    [InlineData(26)]
    [InlineData(40)]
    [InlineData(50)]
    public async Task GenerateRankingsAsync_TracksWinsVsRank26To50(int opponentRank)
    {
        var result = await GenerateRankingsWithOpponentAtRankAsync(opponentRank, isWin: true);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.VsRank26To50.Wins);
        Assert.Equal(0, teamA.Details.VsRank26To50.Losses);
    }

    [Theory]
    [InlineData(51)]
    [InlineData(75)]
    [InlineData(100)]
    public async Task GenerateRankingsAsync_TracksWinsVsRank51To100(int opponentRank)
    {
        var result = await GenerateRankingsWithOpponentAtRankAsync(opponentRank, isWin: true);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.VsRank51To100.Wins);
        Assert.Equal(0, teamA.Details.VsRank51To100.Losses);
    }

    [Theory]
    [InlineData(101)]
    [InlineData(125)]
    [InlineData(150)]
    public async Task GenerateRankingsAsync_TracksWinsVsRank101Plus(int opponentRank)
    {
        var result = await GenerateRankingsWithOpponentAtRankAsync(opponentRank, isWin: true);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.VsRank101Plus.Wins);
        Assert.Equal(0, teamA.Details.VsRank101Plus.Losses);
    }

    [Fact]
    public async Task GenerateRankingsAsync_PopulatesRatingComponents()
    {
        var seasonData = CreateSeasonDataWithTeams("Team A");
        var components = new Dictionary<string, double>
        {
            ["WinPercentage"] = 0.75,
            ["MarginOfVictory"] = 12.5,
            ["SOSFactor"] = 0.62
        };
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Rating = 80.0,
                RatingComponents = components
            }
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var team = result.Rankings.First();
        Assert.Equal(3, team.RatingComponents.Count);
        Assert.Equal(0.75, team.RatingComponents["WinPercentage"]);
        Assert.Equal(12.5, team.RatingComponents["MarginOfVictory"]);
        Assert.Equal(0.62, team.RatingComponents["SOSFactor"]);
    }

    [Fact]
    public async Task GenerateRankingsAsync_RatingComponentsDefaultsToEmptyDictionary()
    {
        var seasonData = CreateSeasonDataWithTeams("Team A");
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = CreateRatingDetails(rating: 80.0)
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var team = result.Rankings.First();
        Assert.NotNull(team.RatingComponents);
        Assert.Empty(team.RatingComponents);
    }

    [Fact]
    public async Task GenerateRankingsAsync_PopulatesStrengthOfSchedule()
    {
        var seasonData = CreateSeasonDataWithTeams("Team A");
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Rating = 80.0,
                StrengthOfSchedule = 0.654321789
            }
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var team = result.Rankings.First();
        Assert.Equal(0.6543, team.StrengthOfSchedule);
    }

    [Fact]
    public async Task GenerateRankingsAsync_RoundsStrengthOfScheduleToFourDecimals()
    {
        var seasonData = CreateSeasonDataWithTeams("Team A");
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = new RatingDetails
            {
                Rating = 80.0,
                StrengthOfSchedule = 0.123456789
            }
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        Assert.Equal(0.1235, result.Rankings.First().StrengthOfSchedule);
    }

    [Fact]
    public async Task GenerateRankingsAsync_WhenOpponentNotRanked_DefaultsToTier5()
    {
        var game = new Game { HomeTeam = "Team A", AwayTeam = "Unranked Opponent", HomePoints = 28, AwayPoints = 14 };
        var seasonData = CreateSeasonDataWithGames("Team A", [game]);
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = CreateRatingDetails(rating: 90.0)
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var teamA = result.Rankings.First();
        Assert.Equal(1, teamA.Details.VsRank101Plus.Wins);
    }

    [Fact]
    public async Task GenerateRankingsAsync_TracksMultipleGamesCorrectly()
    {
        var games = new List<Game>
        {
            new Game { HomeTeam = "Team A", AwayTeam = "Team B", HomePoints = 28, AwayPoints = 14, NeutralSite = false },
            new Game { HomeTeam = "Team C", AwayTeam = "Team A", HomePoints = 14, AwayPoints = 21, NeutralSite = false },
            new Game { HomeTeam = "Team A", AwayTeam = "Team D", HomePoints = 17, AwayPoints = 24, NeutralSite = true }
        };

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                ["Team A"] = new TeamInfo { Name = "Team A", Games = games },
                ["Team B"] = new TeamInfo { Name = "Team B", Games = [] },
                ["Team C"] = new TeamInfo { Name = "Team C", Games = [] },
                ["Team D"] = new TeamInfo { Name = "Team D", Games = [] }
            }
        };

        var ratings = CreateRatingsForTeams(
            ("Team A", 100.0),
            ("Team B", 90.0),
            ("Team C", 80.0),
            ("Team D", 70.0));

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, teamA.Details.Home.Wins);
        Assert.Equal(0, teamA.Details.Home.Losses);
        Assert.Equal(1, teamA.Details.Away.Wins);
        Assert.Equal(0, teamA.Details.Away.Losses);
        Assert.Equal(0, teamA.Details.Neutral.Wins);
        Assert.Equal(1, teamA.Details.Neutral.Losses);
    }

    [Fact]
    public async Task GetPublishedSnapshotAsync_DelegatesToRankingsData()
    {
        var snapshot = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        _mockRankingsData.Setup(x => x.GetPublishedSnapshotAsync(2024, 5)).ReturnsAsync(snapshot);

        var result = await _rankingsModule.GetPublishedSnapshotAsync(2024, 5);

        Assert.Equal(snapshot, result);
        _mockRankingsData.Verify(x => x.GetPublishedSnapshotAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task GetSnapshotAsync_DelegatesToRankingsData()
    {
        var snapshot = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        _mockRankingsData.Setup(x => x.GetSnapshotAsync(2024, 5)).ReturnsAsync(snapshot);

        var result = await _rankingsModule.GetSnapshotAsync(2024, 5);

        Assert.Equal(snapshot, result);
        _mockRankingsData.Verify(x => x.GetSnapshotAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task SaveSnapshotAsync_DelegatesToRankingsData()
    {
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };
        _mockRankingsData.Setup(x => x.SaveSnapshotAsync(rankings)).ReturnsAsync(true);

        var result = await _rankingsModule.SaveSnapshotAsync(rankings);

        Assert.True(result);
        _mockRankingsData.Verify(x => x.SaveSnapshotAsync(rankings), Times.Once);
    }

    [Fact]
    public async Task PublishSnapshotAsync_DelegatesToRankingsData()
    {
        _mockRankingsData.Setup(x => x.PublishSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _rankingsModule.PublishSnapshotAsync(2024, 5);

        Assert.True(result);
        _mockRankingsData.Verify(x => x.PublishSnapshotAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task DeleteSnapshotAsync_DelegatesToRankingsData()
    {
        _mockRankingsData.Setup(x => x.DeleteSnapshotAsync(2024, 5)).ReturnsAsync(true);

        var result = await _rankingsModule.DeleteSnapshotAsync(2024, 5);

        Assert.True(result);
        _mockRankingsData.Verify(x => x.DeleteSnapshotAsync(2024, 5), Times.Once);
    }

    [Fact]
    public async Task GetPersistedWeeksAsync_DelegatesToRankingsData()
    {
        var weeks = new List<PersistedWeekSummary>
        {
            new PersistedWeekSummary { Season = 2024, Week = 1, Published = true }
        };
        _mockRankingsData.Setup(x => x.GetPersistedWeeksAsync()).ReturnsAsync(weeks);

        var result = await _rankingsModule.GetPersistedWeeksAsync();

        Assert.Single(result);
        _mockRankingsData.Verify(x => x.GetPersistedWeeksAsync(), Times.Once);
    }

    [Fact]
    public async Task GetAvailableWeeksAsync_ReturnsPublishedWeeksOnly()
    {
        _mockRankingsData
            .Setup(x => x.GetPublishedWeekNumbersAsync(2024))
            .ReturnsAsync(new List<int> { 1, 3, 5 });

        var calendarWeeks = new List<CalendarWeek>
        {
            new CalendarWeek { Week = 1, SeasonType = "regular" },
            new CalendarWeek { Week = 2, SeasonType = "regular" },
            new CalendarWeek { Week = 3, SeasonType = "regular" },
            new CalendarWeek { Week = 4, SeasonType = "regular" },
            new CalendarWeek { Week = 5, SeasonType = "regular" }
        };

        _mockSeasonModule
            .Setup(x => x.GetWeekLabels(calendarWeeks))
            .Returns(new List<WeekInfo>
            {
                new WeekInfo { WeekNumber = 1, Label = "Week 1" },
                new WeekInfo { WeekNumber = 2, Label = "Week 2" },
                new WeekInfo { WeekNumber = 3, Label = "Week 3" },
                new WeekInfo { WeekNumber = 4, Label = "Week 4" },
                new WeekInfo { WeekNumber = 5, Label = "Week 5" }
            });

        var result = (await _rankingsModule.GetAvailableWeeksAsync(2024, calendarWeeks)).ToList();

        Assert.Equal(3, result.Count);
        Assert.Contains(result, w => w.WeekNumber == 1);
        Assert.Contains(result, w => w.WeekNumber == 3);
        Assert.Contains(result, w => w.WeekNumber == 5);
    }

    [Fact]
    public async Task GetAvailableWeeksAsync_NoPublishedWeeks_ReturnsEmpty()
    {
        _mockRankingsData
            .Setup(x => x.GetPublishedWeekNumbersAsync(2024))
            .ReturnsAsync(new List<int>());

        var calendarWeeks = new List<CalendarWeek>
        {
            new CalendarWeek { Week = 1, SeasonType = "regular" }
        };

        _mockSeasonModule
            .Setup(x => x.GetWeekLabels(calendarWeeks))
            .Returns(new List<WeekInfo>
            {
                new WeekInfo { WeekNumber = 1, Label = "Week 1" }
            });

        var result = await _rankingsModule.GetAvailableWeeksAsync(2024, calendarWeeks);

        Assert.Empty(result);
    }

    private static RatingDetails CreateRatingDetails(
        double rating = 0.0,
        int wins = 0,
        int losses = 0,
        double weightedSOS = 0.0)
    {
        return new RatingDetails
        {
            Rating = rating,
            Wins = wins,
            Losses = losses,
            WeightedStrengthOfSchedule = weightedSOS
        };
    }

    private static SeasonData CreateSeasonDataWithTeams(params string[] teamNames)
    {
        var teams = teamNames.ToDictionary(
            name => name,
            name => new TeamInfo { Name = name, Games = [] });

        return new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = teams
        };
    }

    private static SeasonData CreateSeasonDataWithGames(string teamName, IEnumerable<Game> games)
    {
        return new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = new Dictionary<string, TeamInfo>
            {
                [teamName] = new TeamInfo { Name = teamName, Games = games }
            }
        };
    }

    private static IDictionary<string, RatingDetails> CreateRatingsForTeams(params (string Name, double Rating)[] teams)
    {
        return teams.ToDictionary(
            t => t.Name,
            t => CreateRatingDetails(rating: t.Rating));
    }

    private async Task<RankingsResult> GenerateRankingsWithOpponentAtRankAsync(int opponentRank, bool isWin)
    {
        var teamAPoints = isWin ? 28 : 14;
        var opponentPoints = isWin ? 14 : 28;

        var game = new Game
        {
            HomeTeam = "Team A",
            AwayTeam = "Opponent",
            HomePoints = teamAPoints,
            AwayPoints = opponentPoints
        };

        var teams = new Dictionary<string, TeamInfo>
        {
            ["Team A"] = new TeamInfo { Name = "Team A", Games = [game] },
            ["Opponent"] = new TeamInfo { Name = "Opponent", Games = [] }
        };

        for (var i = 2; i < opponentRank; i++)
        {
            var fillerName = $"Filler{i}";
            teams[fillerName] = new TeamInfo { Name = fillerName, Games = [] };
        }

        var seasonData = new SeasonData
        {
            Season = 2024,
            Week = 5,
            Teams = teams
        };

        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = CreateRatingDetails(rating: 1000.0),
            ["Opponent"] = CreateRatingDetails(rating: 1000.0 - opponentRank)
        };

        for (var i = 2; i < opponentRank; i++)
        {
            var fillerName = $"Filler{i}";
            ratings[fillerName] = CreateRatingDetails(rating: 1000.0 - i);
        }

        return await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);
    }

    [Theory]
    [InlineData(85.12344, 85.1234)]
    [InlineData(85.12345, 85.1234)]
    [InlineData(85.12346, 85.1235)]
    [InlineData(0.0, 0.0)]
    [InlineData(99.99999, 100.0)]
    public async Task GenerateRankingsAsync_RatingRoundingBoundary_RoundsCorrectly(
        double inputRating, double expectedRating)
    {
        var seasonData = CreateSeasonDataWithTeams("Team A");
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = CreateRatingDetails(rating: inputRating)
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        Assert.Equal(expectedRating, result.Rankings.First().Rating);
    }

    [Theory]
    [InlineData(0.56784, 0.5678)]
    [InlineData(0.56785, 0.5678)]
    [InlineData(0.56786, 0.5679)]
    [InlineData(0.0, 0.0)]
    public async Task GenerateRankingsAsync_WeightedSOSRoundingBoundary_RoundsCorrectly(
        double inputSOS, double expectedSOS)
    {
        var seasonData = CreateSeasonDataWithTeams("Team A");
        var ratings = new Dictionary<string, RatingDetails>
        {
            ["Team A"] = CreateRatingDetails(rating: 80.0, weightedSOS: inputSOS)
        };

        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        Assert.Equal(expectedSOS, result.Rankings.First().WeightedSOS);
    }

    [Theory]
    [InlineData(10)]
    [InlineData(11)]
    [InlineData(25)]
    [InlineData(26)]
    [InlineData(50)]
    [InlineData(51)]
    [InlineData(100)]
    [InlineData(101)]
    public async Task GenerateRankingsAsync_OpponentAtTierBoundary_OnlyIncrementsBoundaryTier(int opponentRank)
    {
        var result = await GenerateRankingsWithOpponentAtRankAsync(opponentRank, isWin: true);

        var teamA = result.Rankings.First(t => t.TeamName.Equals("Team A", StringComparison.OrdinalIgnoreCase));

        var expectedTier1 = opponentRank <= 10 ? 1 : 0;
        var expectedTier2 = opponentRank > 10 && opponentRank <= 25 ? 1 : 0;
        var expectedTier3 = opponentRank > 25 && opponentRank <= 50 ? 1 : 0;
        var expectedTier4 = opponentRank > 50 && opponentRank <= 100 ? 1 : 0;
        var expectedTier5 = opponentRank > 100 ? 1 : 0;

        Assert.Equal(expectedTier1, teamA.Details.VsRank1To10.Wins);
        Assert.Equal(expectedTier2, teamA.Details.VsRank11To25.Wins);
        Assert.Equal(expectedTier3, teamA.Details.VsRank26To50.Wins);
        Assert.Equal(expectedTier4, teamA.Details.VsRank51To100.Wins);
        Assert.Equal(expectedTier5, teamA.Details.VsRank101Plus.Wins);
    }

    [Fact]
    public async Task GetAvailableWeeksAsync_GetPublishedWeekNumbersAsyncThrows_PropagatesException()
    {
        _mockRankingsData
            .Setup(x => x.GetPublishedWeekNumbersAsync(2024))
            .ThrowsAsync(new InvalidOperationException("Database unavailable"));

        var calendarWeeks = new List<CalendarWeek>
        {
            new CalendarWeek { Week = 1, SeasonType = "regular" }
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _rankingsModule.GetAvailableWeeksAsync(2024, calendarWeeks));
    }

    [Fact]
    public async Task SaveSnapshotAsync_DataLayerThrows_PropagatesException()
    {
        var rankings = new RankingsResult { Season = 2024, Week = 5, Rankings = [] };

        _mockRankingsData
            .Setup(x => x.SaveSnapshotAsync(rankings))
            .ThrowsAsync(new InvalidOperationException("Database write failed"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _rankingsModule.SaveSnapshotAsync(rankings));
    }

    [Fact]
    public async Task GenerateRankingsAsync_NullSeasonData_ThrowsArgumentNullException()
    {
        var ratings = new Dictionary<string, RatingDetails>();

        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _rankingsModule.GenerateRankingsAsync(null!, ratings));
    }

    [Fact]
    public async Task GenerateRankingsAsync_NullRatings_ThrowsArgumentNullException()
    {
        var seasonData = new SeasonData { Season = 2024, Week = 5, Teams = new Dictionary<string, TeamInfo>() };

        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _rankingsModule.GenerateRankingsAsync(seasonData, null!));
    }

    [Fact]
    public async Task GetAvailableWeeksAsync_NullCalendarWeeks_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _rankingsModule.GetAvailableWeeksAsync(2024, null!));
    }

    [Fact]
    public async Task SaveSnapshotAsync_NullRankings_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _rankingsModule.SaveSnapshotAsync(null!));
    }
}
