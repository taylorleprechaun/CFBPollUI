using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.Core.Tests.Models;

public class ScheduleGameTests
{
    [Fact]
    public void ScheduleGame_PropertiesCanBeSetAndRetrieved()
    {
        var startDate = new DateTime(2024, 9, 7, 19, 0, 0);

        var game = new ScheduleGame
        {
            AwayPoints = 21,
            AwayTeam = "Oklahoma",
            Completed = true,
            GameID = 401628455,
            HomePoints = 34,
            HomeTeam = "Texas",
            NeutralSite = true,
            SeasonType = "regular",
            StartDate = startDate,
            StartTimeTbd = false,
            Venue = "Cotton Bowl",
            Week = 6
        };

        Assert.Equal(21, game.AwayPoints);
        Assert.Equal("Oklahoma", game.AwayTeam);
        Assert.True(game.Completed);
        Assert.Equal(401628455, game.GameID);
        Assert.Equal(34, game.HomePoints);
        Assert.Equal("Texas", game.HomeTeam);
        Assert.True(game.NeutralSite);
        Assert.Equal("regular", game.SeasonType);
        Assert.Equal(startDate, game.StartDate);
        Assert.False(game.StartTimeTbd);
        Assert.Equal("Cotton Bowl", game.Venue);
        Assert.Equal(6, game.Week);
    }

    [Fact]
    public void ScheduleGame_NullablePropertiesDefaultToNull()
    {
        var game = new ScheduleGame();

        Assert.Null(game.AwayPoints);
        Assert.Null(game.AwayTeam);
        Assert.Null(game.GameID);
        Assert.Null(game.HomePoints);
        Assert.Null(game.HomeTeam);
        Assert.Null(game.SeasonType);
        Assert.Null(game.StartDate);
        Assert.Null(game.Venue);
        Assert.Null(game.Week);
    }

    [Fact]
    public void ScheduleGame_BooleanPropertiesDefaultToFalse()
    {
        var game = new ScheduleGame();

        Assert.False(game.Completed);
        Assert.False(game.NeutralSite);
        Assert.False(game.StartTimeTbd);
    }
}
