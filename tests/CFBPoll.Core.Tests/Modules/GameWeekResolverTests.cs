using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class GameWeekResolverTests
{
    [Fact]
    public void Resolve_EmptySchedule_TreatsGameWeekAsPostseason()
    {
        var (gameWeek, isPostseason) = GameWeekResolver.Resolve(0, []);

        Assert.Equal(1, gameWeek);
        Assert.True(isPostseason);
    }

    [Fact]
    public void Resolve_GameWeekEqualsMaxRegularWeek_ReturnsNotPostseason()
    {
        List<ScheduleGame> fullSchedule = [new ScheduleGame { Week = 15, SeasonType = "regular" }];

        var (gameWeek, isPostseason) = GameWeekResolver.Resolve(14, fullSchedule);

        Assert.Equal(15, gameWeek);
        Assert.False(isPostseason);
    }

    [Fact]
    public void Resolve_GameWeekExceedsMaxRegularWeek_ReturnsPostseason()
    {
        List<ScheduleGame> fullSchedule = [new ScheduleGame { Week = 15, SeasonType = "regular" }];

        var (gameWeek, isPostseason) = GameWeekResolver.Resolve(15, fullSchedule);

        Assert.Equal(16, gameWeek);
        Assert.True(isPostseason);
    }

    [Fact]
    public void Resolve_IgnoresGamesWithNonRegularSeasonType()
    {
        List<ScheduleGame> fullSchedule =
        [
            new ScheduleGame { Week = 20, SeasonType = "postseason" },
            new ScheduleGame { Week = 15, SeasonType = "regular" }
        ];

        var (gameWeek, isPostseason) = GameWeekResolver.Resolve(14, fullSchedule);

        Assert.Equal(15, gameWeek);
        Assert.False(isPostseason);
    }

    [Fact]
    public void Resolve_IgnoresGamesWithNullWeek()
    {
        List<ScheduleGame> fullSchedule =
        [
            new ScheduleGame { Week = null, SeasonType = "regular" },
            new ScheduleGame { Week = 10, SeasonType = "regular" }
        ];

        var (gameWeek, isPostseason) = GameWeekResolver.Resolve(9, fullSchedule);

        Assert.Equal(10, gameWeek);
        Assert.False(isPostseason);
    }

    [Fact]
    public void Resolve_NullFullSchedule_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => GameWeekResolver.Resolve(5, null!));
    }

    [Fact]
    public void Resolve_RegularSeasonWeek_ReturnsIncrementedGameWeek()
    {
        List<ScheduleGame> fullSchedule = [new ScheduleGame { Week = 15, SeasonType = "regular" }];

        var (gameWeek, isPostseason) = GameWeekResolver.Resolve(4, fullSchedule);

        Assert.Equal(5, gameWeek);
        Assert.False(isPostseason);
    }

    [Fact]
    public void Resolve_SeasonTypeCasingDiffers_StillIncludedInMaxCalculation()
    {
        List<ScheduleGame> fullSchedule = [new ScheduleGame { Week = 15, SeasonType = "REGULAR" }];

        var (gameWeek, isPostseason) = GameWeekResolver.Resolve(14, fullSchedule);

        Assert.Equal(15, gameWeek);
        Assert.False(isPostseason);
    }
}
