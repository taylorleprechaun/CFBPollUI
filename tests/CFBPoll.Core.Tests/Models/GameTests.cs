using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.Core.Tests.Models;

public class GameTests
{
    [Fact]
    public void Game_AdvancedStatsPropertyCanBeSetAndRetrieved()
    {
        var advancedStats = new AdvancedGameStats
        {
            GameID = 12345,
            Team = "Texas",
            Opponent = "Oklahoma",
            Week = 6
        };

        var game = new Game
        {
            GameID = 12345,
            HomeTeam = "Texas",
            AwayTeam = "Oklahoma",
            HomePoints = 34,
            AwayPoints = 28,
            Week = 6,
            SeasonType = "regular",
            NeutralSite = true,
            AdvancedStats = advancedStats
        };

        Assert.Same(advancedStats, game.AdvancedStats);
        Assert.Equal(12345, game.GameID);
        Assert.Equal("Texas", game.HomeTeam);
        Assert.Equal("Oklahoma", game.AwayTeam);
        Assert.Equal(34, game.HomePoints);
        Assert.Equal(28, game.AwayPoints);
        Assert.Equal(6, game.Week);
        Assert.Equal("regular", game.SeasonType);
        Assert.True(game.NeutralSite);
    }

    [Fact]
    public void Game_AdvancedStatsDefaultsToNull()
    {
        var game = new Game();

        Assert.Null(game.AdvancedStats);
    }
}
