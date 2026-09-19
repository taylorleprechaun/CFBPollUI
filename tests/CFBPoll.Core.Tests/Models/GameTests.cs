using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.Core.Tests.Models;

public class GameTests
{
    [Fact]
    public void Clone_PopulatedGame_CopiesEveryWritableProperty()
    {
        var original = new Game();
        var properties = typeof(Game).GetProperties().Where(p => p.CanWrite).ToList();
        foreach (var property in properties)
        {
            property.SetValue(original, CreateSampleValue(property.PropertyType));
        }

        var clone = original.Clone();

        Assert.NotSame(original, clone);
        foreach (var property in properties)
        {
            Assert.Equal(property.GetValue(original), property.GetValue(clone));
        }
    }

    [Fact]
    public void Clone_ChangingCloneScores_DoesNotAffectOriginal()
    {
        var original = new Game { HomePoints = 24, AwayPoints = 21 };

        var clone = original.Clone();
        clone.HomePoints = 10;

        Assert.Equal(24, original.HomePoints);
    }

    [Fact]
    public void Game_AdvancedStatsDefaultToNull()
    {
        var game = new Game();

        Assert.Null(game.HomeAdvancedStats);
        Assert.Null(game.AwayAdvancedStats);
    }

    [Fact]
    public void Game_AdvancedStatsPropertiesCanBeSetAndRetrieved()
    {
        var homeAdvancedStats = new AdvancedGameStats
        {
            GameID = 12345,
            Team = "Texas",
            Opponent = "Oklahoma",
            Week = 6
        };

        var awayAdvancedStats = new AdvancedGameStats
        {
            GameID = 12345,
            Team = "Oklahoma",
            Opponent = "Texas",
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
            HomeAdvancedStats = homeAdvancedStats,
            AwayAdvancedStats = awayAdvancedStats
        };

        Assert.Same(homeAdvancedStats, game.HomeAdvancedStats);
        Assert.Same(awayAdvancedStats, game.AwayAdvancedStats);
        Assert.Equal(12345, game.GameID);
        Assert.Equal("Texas", game.HomeTeam);
        Assert.Equal("Oklahoma", game.AwayTeam);
        Assert.Equal(34, game.HomePoints);
        Assert.Equal(28, game.AwayPoints);
        Assert.Equal(6, game.Week);
        Assert.Equal("regular", game.SeasonType);
        Assert.True(game.NeutralSite);
    }

    private static object CreateSampleValue(Type type)
    {
        var underlying = Nullable.GetUnderlyingType(type) ?? type;

        if (underlying == typeof(int)) return 7;
        if (underlying == typeof(long)) return 7L;
        if (underlying == typeof(bool)) return true;
        if (underlying == typeof(string)) return "sample";
        if (underlying == typeof(DateTime)) return new DateTime(2026, 9, 1);
        if (underlying.IsInterface) return Activator.CreateInstance(typeof(List<>).MakeGenericType(underlying.GetGenericArguments()))!;

        return Activator.CreateInstance(underlying)!;
    }
}
