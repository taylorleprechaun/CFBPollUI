using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.Core.Tests.Models;

public class AdvancedGameStatsTests
{
    [Fact]
    public void AdvancedGameStats_PropertiesCanBeSetAndRetrieved()
    {
        var offense = new AdvancedGameStatsUnit { Plays = 70, PPA = 0.25 };
        var defense = new AdvancedGameStatsUnit { Plays = 65, PPA = -0.15 };

        var stats = new AdvancedGameStats
        {
            GameID = 12345,
            Team = "Alabama",
            Opponent = "Florida",
            Week = 5,
            Offense = offense,
            Defense = defense
        };

        Assert.Equal(12345, stats.GameID);
        Assert.Equal("Alabama", stats.Team);
        Assert.Equal("Florida", stats.Opponent);
        Assert.Equal(5, stats.Week);
        Assert.Same(offense, stats.Offense);
        Assert.Same(defense, stats.Defense);
    }

    [Fact]
    public void AdvancedGameStats_PropertiesDefaultToNull()
    {
        var stats = new AdvancedGameStats();

        Assert.Null(stats.GameID);
        Assert.Null(stats.Team);
        Assert.Null(stats.Opponent);
        Assert.Null(stats.Week);
        Assert.Null(stats.Offense);
        Assert.Null(stats.Defense);
    }

    [Fact]
    public void AdvancedGameStatsUnit_AllPropertiesCanBeSetAndRetrieved()
    {
        var unit = new AdvancedGameStatsUnit
        {
            Drives = 12,
            Explosiveness = 1.25,
            LineYards = 45.5,
            LineYardsTotal = 182.0,
            OpenFieldYards = 3.2,
            OpenFieldYardsTotal = 128.0,
            PassingDownsExplosiveness = 1.1,
            PassingDownsPPA = 0.15,
            PassingDownsSuccessRate = 0.42,
            PassingPlays = 35.0,
            PassingPPA = 0.28,
            Plays = 70,
            PowerSuccess = 0.65,
            PPA = 0.25,
            RushingPlays = 35.0,
            RushingPPA = 0.22,
            SecondLevelYards = 2.8,
            SecondLevelYardsTotal = 112.0,
            StandardDownsExplosiveness = 1.3,
            StandardDownsPPA = 0.30,
            StandardDownsSuccessRate = 0.55,
            StuffRate = 0.18,
            SuccessRate = 0.48,
            TotalPPA = 17.5
        };

        Assert.Equal(12, unit.Drives);
        Assert.Equal(1.25, unit.Explosiveness);
        Assert.Equal(45.5, unit.LineYards);
        Assert.Equal(182.0, unit.LineYardsTotal);
        Assert.Equal(3.2, unit.OpenFieldYards);
        Assert.Equal(128.0, unit.OpenFieldYardsTotal);
        Assert.Equal(1.1, unit.PassingDownsExplosiveness);
        Assert.Equal(0.15, unit.PassingDownsPPA);
        Assert.Equal(0.42, unit.PassingDownsSuccessRate);
        Assert.Equal(35.0, unit.PassingPlays);
        Assert.Equal(0.28, unit.PassingPPA);
        Assert.Equal(70, unit.Plays);
        Assert.Equal(0.65, unit.PowerSuccess);
        Assert.Equal(0.25, unit.PPA);
        Assert.Equal(35.0, unit.RushingPlays);
        Assert.Equal(0.22, unit.RushingPPA);
        Assert.Equal(2.8, unit.SecondLevelYards);
        Assert.Equal(112.0, unit.SecondLevelYardsTotal);
        Assert.Equal(1.3, unit.StandardDownsExplosiveness);
        Assert.Equal(0.30, unit.StandardDownsPPA);
        Assert.Equal(0.55, unit.StandardDownsSuccessRate);
        Assert.Equal(0.18, unit.StuffRate);
        Assert.Equal(0.48, unit.SuccessRate);
        Assert.Equal(17.5, unit.TotalPPA);
    }

    [Fact]
    public void AdvancedGameStatsUnit_PropertiesDefaultToNull()
    {
        var unit = new AdvancedGameStatsUnit();

        Assert.Null(unit.Drives);
        Assert.Null(unit.Explosiveness);
        Assert.Null(unit.LineYards);
        Assert.Null(unit.LineYardsTotal);
        Assert.Null(unit.OpenFieldYards);
        Assert.Null(unit.OpenFieldYardsTotal);
        Assert.Null(unit.PassingDownsExplosiveness);
        Assert.Null(unit.PassingDownsPPA);
        Assert.Null(unit.PassingDownsSuccessRate);
        Assert.Null(unit.PassingPlays);
        Assert.Null(unit.PassingPPA);
        Assert.Null(unit.Plays);
        Assert.Null(unit.PowerSuccess);
        Assert.Null(unit.PPA);
        Assert.Null(unit.RushingPlays);
        Assert.Null(unit.RushingPPA);
        Assert.Null(unit.SecondLevelYards);
        Assert.Null(unit.SecondLevelYardsTotal);
        Assert.Null(unit.StandardDownsExplosiveness);
        Assert.Null(unit.StandardDownsPPA);
        Assert.Null(unit.StandardDownsSuccessRate);
        Assert.Null(unit.StuffRate);
        Assert.Null(unit.SuccessRate);
        Assert.Null(unit.TotalPPA);
    }
}
