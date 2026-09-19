using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.Core.Tests.Models;

public class ScheduleGameTests
{
    [Fact]
    public void Clone_PopulatedGame_CopiesEveryWritableProperty()
    {
        var original = new ScheduleGame();
        var properties = typeof(ScheduleGame).GetProperties().Where(p => p.CanWrite).ToList();
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
        var original = new ScheduleGame { HomePoints = 24, AwayPoints = 21 };

        var clone = original.Clone();
        clone.HomePoints = 10;

        Assert.Equal(24, original.HomePoints);
    }

    [Fact]
    public void ScheduleGame_BooleanPropertiesDefaultToFalse()
    {
        var game = new ScheduleGame();

        Assert.False(game.Completed);
        Assert.False(game.NeutralSite);
        Assert.False(game.StartTimeTbd);
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
