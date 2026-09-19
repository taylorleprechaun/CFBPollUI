using CFBPoll.Core.Models;
using CFBPoll.Core.Services;
using Xunit;

namespace CFBPoll.Core.Tests.Services;

public class ScheduleGameDeduplicatorTests
{
    [Fact]
    public void Deduplicate_DuplicateGames_KeepsHighestGameID()
    {
        var games = new List<ScheduleGame>
        {
            CreateGame(401000001, "Florida", "Iowa", week: 4, homePoints: 24, awayPoints: 20),
            CreateGame(401000009, "Florida", "Iowa", week: 4, homePoints: 24, awayPoints: 20)
        };

        var result = ScheduleGameDeduplicator.Deduplicate(games).ToList();

        var kept = Assert.Single(result);
        Assert.Equal(401000009, kept.GameID);
    }

    [Fact]
    public void Deduplicate_DuplicateGamesDifferingOnlyByCase_TreatsThemAsTheSameGame()
    {
        var games = new List<ScheduleGame>
        {
            CreateGame(401000001, "Iowa", "Oklahoma", week: 12, homePoints: 27, awayPoints: 13),
            CreateGame(401000002, "IOWA", "OKLAHOMA", week: 12, homePoints: 27, awayPoints: 13)
        };

        var result = ScheduleGameDeduplicator.Deduplicate(games).ToList();

        Assert.Single(result);
    }

    [Fact]
    public void Deduplicate_DuplicateWhereLowerIDIsTheScoredGame_KeepsTheScoredGame()
    {
        var games = new List<ScheduleGame>
        {
            CreateGame(401000001, "Texas", "Iowa", week: 6, homePoints: 31, awayPoints: 17),
            CreateGame(401000009, "Texas", "Iowa", week: 6, homePoints: null, awayPoints: null)
        };

        var result = ScheduleGameDeduplicator.Deduplicate(games).ToList();

        var kept = Assert.Single(result);
        Assert.Equal(401000001, kept.GameID);
    }

    [Fact]
    public void Deduplicate_GamesWithoutBothTeams_AreAllKept()
    {
        var games = new List<ScheduleGame>
        {
            CreateGame(401000001, null, null, week: 16, homePoints: null, awayPoints: null, seasonType: "postseason"),
            CreateGame(401000002, null, null, week: 16, homePoints: null, awayPoints: null, seasonType: "postseason"),
            CreateGame(401000003, "USC", null, week: 16, homePoints: null, awayPoints: null, seasonType: "postseason")
        };

        var result = ScheduleGameDeduplicator.Deduplicate(games).ToList();

        Assert.Equal(3, result.Count);
    }

    [Fact]
    public void Deduplicate_NoDuplicates_ReturnsEveryGame()
    {
        var games = new List<ScheduleGame>
        {
            CreateGame(401000001, "Alabama", "Nebraska", week: 1, homePoints: 35, awayPoints: 10),
            CreateGame(401000002, "Notre Dame", "Iowa", week: 1, homePoints: 21, awayPoints: 14)
        };

        var result = ScheduleGameDeduplicator.Deduplicate(games).ToList();

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void Deduplicate_NullGames_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => ScheduleGameDeduplicator.Deduplicate(null!));
    }

    [Fact]
    public void Deduplicate_PreservesOriginalOrdering()
    {
        var games = new List<ScheduleGame>
        {
            CreateGame(401000003, "Alabama", "Iowa", week: 3, homePoints: 20, awayPoints: 17),
            CreateGame(401000001, "Florida", "Iowa", week: 1, homePoints: 24, awayPoints: 20),
            CreateGame(401000009, "Florida", "Iowa", week: 1, homePoints: 24, awayPoints: 20),
            CreateGame(401000002, "USC", "Nebraska", week: 2, homePoints: 28, awayPoints: 21)
        };

        var result = ScheduleGameDeduplicator.Deduplicate(games).ToList();

        Assert.Equal([401000003L, 401000009L, 401000002L], result.Select(g => g.GameID!.Value));
    }

    [Fact]
    public void Deduplicate_SameTeamsInDifferentWeeks_KeepsBothGames()
    {
        var games = new List<ScheduleGame>
        {
            CreateGame(401000001, "Iowa", "Oklahoma", week: 12, homePoints: 27, awayPoints: 13),
            CreateGame(401000002, "Iowa", "Oklahoma", week: 16, homePoints: 30, awayPoints: 24, seasonType: "postseason")
        };

        var result = ScheduleGameDeduplicator.Deduplicate(games).ToList();

        Assert.Equal(2, result.Count);
    }

    private static ScheduleGame CreateGame(
        long gameID,
        string? homeTeam,
        string? awayTeam,
        int week,
        int? homePoints,
        int? awayPoints,
        string seasonType = "regular")
    {
        return new ScheduleGame
        {
            AwayPoints = awayPoints,
            AwayTeam = awayTeam,
            Completed = homePoints.HasValue && awayPoints.HasValue,
            GameID = gameID,
            HomePoints = homePoints,
            HomeTeam = homeTeam,
            SeasonType = seasonType,
            Week = week
        };
    }
}
