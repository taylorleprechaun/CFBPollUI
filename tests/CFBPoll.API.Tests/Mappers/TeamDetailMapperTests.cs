using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

using Record = CFBPoll.Core.Models.Record;

namespace CFBPoll.API.Tests.Mappers;

public class TeamDetailMapperTests
{
    private static RankedTeam CreateDefaultRankedTeam()
    {
        return new RankedTeam
        {
            Conference = "SEC",
            Details = new TeamDetails
            {
                Away = new Record { Wins = 3, Losses = 1 },
                Home = new Record { Wins = 5, Losses = 0 },
                Neutral = new Record { Wins = 1, Losses = 0 },
                VsRank1To10 = new Record { Wins = 1, Losses = 1 },
                VsRank11To25 = new Record { Wins = 2, Losses = 0 },
                VsRank26To50 = new Record { Wins = 2, Losses = 0 },
                VsRank51To100 = new Record { Wins = 3, Losses = 0 },
                VsRank101Plus = new Record { Wins = 1, Losses = 0 }
            },
            Division = "East",
            LogoURL = "https://example.com/georgia.png",
            Losses = 1,
            Rank = 1,
            Rating = 95.5,
            SOSRanking = 3,
            TeamName = "Georgia",
            WeightedSOS = 0.75,
            Wins = 9
        };
    }

    private static TeamInfo CreateDefaultTeamInfo()
    {
        return new TeamInfo
        {
            AltColor = "#000000",
            Color = "#BA0C2F",
            Conference = "SEC",
            Division = "East",
            Games = [],
            LogoURL = "https://example.com/georgia.png",
            Losses = 1,
            Name = "Georgia",
            Wins = 9
        };
    }

    private static List<ScheduleGame> CreateDefaultScheduleGames()
    {
        return new List<ScheduleGame>
        {
            new ScheduleGame
            {
                AwayPoints = 21,
                AwayTeam = "Oregon",
                Completed = true,
                GameID = 1,
                HomePoints = 35,
                HomeTeam = "Georgia",
                NeutralSite = false,
                SeasonType = "regular",
                StartDate = new DateTime(2023, 9, 2),
                StartTimeTbd = false,
                Venue = "Sanford Stadium",
                Week = 1
            }
        };
    }

    private static Dictionary<string, TeamInfo> CreateDefaultAllTeams()
    {
        return new Dictionary<string, TeamInfo>
        {
            ["Georgia"] = CreateDefaultTeamInfo(),
            ["Oregon"] = new TeamInfo
            {
                AltColor = "#FFFFFF",
                Color = "#154733",
                Conference = "Big Ten",
                Division = "",
                Games = [],
                LogoURL = "https://example.com/oregon.png",
                Losses = 2,
                Name = "Oregon",
                Wins = 8
            }
        };
    }

    [Fact]
    public void ToResponseDTO_MapsTeamProperties()
    {
        RankedTeam rankedTeam = CreateDefaultRankedTeam();
        TeamInfo teamInfo = CreateDefaultTeamInfo();
        List<ScheduleGame> schedule = CreateDefaultScheduleGames();
        Dictionary<string, TeamInfo> allTeams = CreateDefaultAllTeams();

        var result = TeamDetailMapper.ToResponseDTO(rankedTeam, teamInfo, schedule, allTeams);

        Assert.Equal("Georgia", result.TeamName);
        Assert.Equal(1, result.Rank);
        Assert.Equal(95.5, result.Rating);
        Assert.Equal("SEC", result.Conference);
        Assert.Equal("East", result.Division);
        Assert.Equal("https://example.com/georgia.png", result.LogoURL);
        Assert.Equal(3, result.SOSRanking);
        Assert.Equal(0.75, result.WeightedSOS);
    }

    [Fact]
    public void ToResponseDTO_MapsColorFields()
    {
        RankedTeam rankedTeam = CreateDefaultRankedTeam();
        TeamInfo teamInfo = CreateDefaultTeamInfo();
        List<ScheduleGame> schedule = CreateDefaultScheduleGames();
        Dictionary<string, TeamInfo> allTeams = CreateDefaultAllTeams();

        var result = TeamDetailMapper.ToResponseDTO(rankedTeam, teamInfo, schedule, allTeams);

        Assert.Equal("#BA0C2F", result.Color);
        Assert.Equal("#000000", result.AltColor);
    }

    [Fact]
    public void ToResponseDTO_MapsRecord()
    {
        RankedTeam rankedTeam = CreateDefaultRankedTeam();
        TeamInfo teamInfo = CreateDefaultTeamInfo();
        List<ScheduleGame> schedule = CreateDefaultScheduleGames();
        Dictionary<string, TeamInfo> allTeams = CreateDefaultAllTeams();

        var result = TeamDetailMapper.ToResponseDTO(rankedTeam, teamInfo, schedule, allTeams);

        Assert.Equal("9-1", result.Record);
    }

    [Fact]
    public void ToResponseDTO_MapsScheduleGames()
    {
        RankedTeam rankedTeam = CreateDefaultRankedTeam();
        TeamInfo teamInfo = CreateDefaultTeamInfo();
        List<ScheduleGame> schedule = CreateDefaultScheduleGames();
        Dictionary<string, TeamInfo> allTeams = CreateDefaultAllTeams();

        var result = TeamDetailMapper.ToResponseDTO(rankedTeam, teamInfo, schedule, allTeams);

        var games = result.Schedule.ToList();
        Assert.Single(games);
        Assert.Equal("Oregon", games[0].OpponentName);
        Assert.Equal(1, games[0].Week);
        Assert.Equal("regular", games[0].SeasonType);
        Assert.Equal("Sanford Stadium", games[0].Venue);
        Assert.Equal(new DateTime(2023, 9, 2), games[0].GameDate);
    }

    [Fact]
    public void ToResponseDTO_DeterminesHomeAwayCorrectly()
    {
        RankedTeam rankedTeam = CreateDefaultRankedTeam();
        TeamInfo teamInfo = CreateDefaultTeamInfo();
        Dictionary<string, TeamInfo> allTeams = CreateDefaultAllTeams();

        var schedule = new List<ScheduleGame>
        {
            new ScheduleGame
            {
                HomeTeam = "Georgia",
                AwayTeam = "Oregon",
                Completed = true,
                HomePoints = 35,
                AwayPoints = 21,
                SeasonType = "regular",
                Week = 1
            },
            new ScheduleGame
            {
                HomeTeam = "Oregon",
                AwayTeam = "Georgia",
                Completed = true,
                HomePoints = 28,
                AwayPoints = 31,
                SeasonType = "regular",
                Week = 5
            }
        };

        var result = TeamDetailMapper.ToResponseDTO(rankedTeam, teamInfo, schedule, allTeams);

        var games = result.Schedule.ToList();
        Assert.Equal(2, games.Count);
        Assert.True(games[0].IsHome);
        Assert.False(games[1].IsHome);
    }

    [Fact]
    public void ToResponseDTO_DeterminesWinLossCorrectly()
    {
        RankedTeam rankedTeam = CreateDefaultRankedTeam();
        TeamInfo teamInfo = CreateDefaultTeamInfo();
        Dictionary<string, TeamInfo> allTeams = CreateDefaultAllTeams();

        var schedule = new List<ScheduleGame>
        {
            new ScheduleGame
            {
                HomeTeam = "Georgia",
                AwayTeam = "Oregon",
                Completed = true,
                HomePoints = 35,
                AwayPoints = 21,
                SeasonType = "regular",
                Week = 1
            },
            new ScheduleGame
            {
                HomeTeam = "Oregon",
                AwayTeam = "Georgia",
                Completed = true,
                HomePoints = 42,
                AwayPoints = 17,
                SeasonType = "regular",
                Week = 5
            }
        };

        var result = TeamDetailMapper.ToResponseDTO(rankedTeam, teamInfo, schedule, allTeams);

        var games = result.Schedule.ToList();
        Assert.True(games[0].IsWin);
        Assert.False(games[1].IsWin);
    }

    [Fact]
    public void ToResponseDTO_SetsNullIsWinForIncompleteGame()
    {
        RankedTeam rankedTeam = CreateDefaultRankedTeam();
        TeamInfo teamInfo = CreateDefaultTeamInfo();
        Dictionary<string, TeamInfo> allTeams = CreateDefaultAllTeams();

        var schedule = new List<ScheduleGame>
        {
            new ScheduleGame
            {
                HomeTeam = "Georgia",
                AwayTeam = "Oregon",
                Completed = false,
                HomePoints = null,
                AwayPoints = null,
                SeasonType = "regular",
                Week = 1
            }
        };

        var result = TeamDetailMapper.ToResponseDTO(rankedTeam, teamInfo, schedule, allTeams);

        var games = result.Schedule.ToList();
        Assert.Single(games);
        Assert.Null(games[0].IsWin);
    }

    [Fact]
    public void ToResponseDTO_MapsOpponentInfoFromAllTeams()
    {
        RankedTeam rankedTeam = CreateDefaultRankedTeam();
        TeamInfo teamInfo = CreateDefaultTeamInfo();
        List<ScheduleGame> schedule = CreateDefaultScheduleGames();
        Dictionary<string, TeamInfo> allTeams = CreateDefaultAllTeams();

        var result = TeamDetailMapper.ToResponseDTO(rankedTeam, teamInfo, schedule, allTeams);

        var games = result.Schedule.ToList();
        Assert.Single(games);
        Assert.Equal("https://example.com/oregon.png", games[0].OpponentLogoURL);
        Assert.Equal("8-2", games[0].OpponentRecord);
    }

    [Fact]
    public void ToResponseDTO_WithNullRankedTeam_ThrowsArgumentNullException()
    {
        TeamInfo teamInfo = CreateDefaultTeamInfo();
        List<ScheduleGame> schedule = CreateDefaultScheduleGames();
        Dictionary<string, TeamInfo> allTeams = CreateDefaultAllTeams();

        Assert.Throws<ArgumentNullException>(() =>
            TeamDetailMapper.ToResponseDTO(null!, teamInfo, schedule, allTeams));
    }

    [Fact]
    public void ToResponseDTO_WithNullTeamInfo_ThrowsArgumentNullException()
    {
        RankedTeam rankedTeam = CreateDefaultRankedTeam();
        List<ScheduleGame> schedule = CreateDefaultScheduleGames();
        Dictionary<string, TeamInfo> allTeams = CreateDefaultAllTeams();

        Assert.Throws<ArgumentNullException>(() =>
            TeamDetailMapper.ToResponseDTO(rankedTeam, null!, schedule, allTeams));
    }

    [Fact]
    public void ToResponseDTO_WithNullScheduleGames_ThrowsArgumentNullException()
    {
        RankedTeam rankedTeam = CreateDefaultRankedTeam();
        TeamInfo teamInfo = CreateDefaultTeamInfo();
        Dictionary<string, TeamInfo> allTeams = CreateDefaultAllTeams();

        Assert.Throws<ArgumentNullException>(() =>
            TeamDetailMapper.ToResponseDTO(rankedTeam, teamInfo, null!, allTeams));
    }

    [Fact]
    public void ToResponseDTO_WithNullAllTeams_ThrowsArgumentNullException()
    {
        RankedTeam rankedTeam = CreateDefaultRankedTeam();
        TeamInfo teamInfo = CreateDefaultTeamInfo();
        List<ScheduleGame> schedule = CreateDefaultScheduleGames();

        Assert.Throws<ArgumentNullException>(() =>
            TeamDetailMapper.ToResponseDTO(rankedTeam, teamInfo, schedule, null!));
    }

    [Fact]
    public void ToResponseDTO_OrdersScheduleBySeasonTypeAndWeek()
    {
        RankedTeam rankedTeam = CreateDefaultRankedTeam();
        TeamInfo teamInfo = CreateDefaultTeamInfo();
        Dictionary<string, TeamInfo> allTeams = CreateDefaultAllTeams();

        var schedule = new List<ScheduleGame>
        {
            new ScheduleGame
            {
                HomeTeam = "Georgia",
                AwayTeam = "Oregon",
                Completed = true,
                HomePoints = 31,
                AwayPoints = 24,
                SeasonType = "postseason",
                Week = 1,
                StartDate = new DateTime(2024, 1, 1)
            },
            new ScheduleGame
            {
                HomeTeam = "Georgia",
                AwayTeam = "Oregon",
                Completed = true,
                HomePoints = 42,
                AwayPoints = 10,
                SeasonType = "regular",
                Week = 12,
                StartDate = new DateTime(2023, 11, 25)
            },
            new ScheduleGame
            {
                HomeTeam = "Oregon",
                AwayTeam = "Georgia",
                Completed = true,
                HomePoints = 14,
                AwayPoints = 38,
                SeasonType = "regular",
                Week = 3,
                StartDate = new DateTime(2023, 9, 16)
            }
        };

        var result = TeamDetailMapper.ToResponseDTO(rankedTeam, teamInfo, schedule, allTeams);

        var games = result.Schedule.ToList();
        Assert.Equal(3, games.Count);
        Assert.Equal("regular", games[0].SeasonType);
        Assert.Equal(3, games[0].Week);
        Assert.Equal("regular", games[1].SeasonType);
        Assert.Equal(12, games[1].Week);
        Assert.Equal("postseason", games[2].SeasonType);
    }
}
