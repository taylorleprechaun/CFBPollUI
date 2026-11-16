using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class PredictionPickComparerTests
{
    [Fact]
    public void Compare_ChangedPickPushes_CountsChangedWithNoWinner()
    {
        var used = Game(spreadPick: "Team A", spreadGrade: PredictionGradeStatus.Push);
        var compared = Game(spreadPick: "Team B", spreadGrade: PredictionGradeStatus.Push);

        var changes = PredictionPickComparer.Compare([used], [compared]);

        Assert.Equal(1, changes.Spread.Changed);
        Assert.Equal(0, changes.Spread.ComparedCorrect);
        Assert.Equal(0, changes.Spread.UsedCorrect);
    }

    [Fact]
    public void Compare_DifferentGameCounts_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => PredictionPickComparer.Compare([Game()], []));
    }

    [Fact]
    public void Compare_DifferentPicks_CountsWhichSideWasRight()
    {
        var used = new[]
        {
            Game(spreadPick: "Team A", spreadGrade: PredictionGradeStatus.Incorrect),
            Game(spreadPick: "Team A", spreadGrade: PredictionGradeStatus.Correct),
            Game(spreadPick: "Team B", spreadGrade: PredictionGradeStatus.Incorrect)
        };
        var compared = new[]
        {
            Game(spreadPick: "Team B", spreadGrade: PredictionGradeStatus.Correct),
            Game(spreadPick: "Team B", spreadGrade: PredictionGradeStatus.Incorrect),
            Game(spreadPick: "Team A", spreadGrade: PredictionGradeStatus.Correct)
        };

        var changes = PredictionPickComparer.Compare(used, compared);

        Assert.Equal(3, changes.Spread.Changed);
        Assert.Equal(2, changes.Spread.ComparedCorrect);
        Assert.Equal(1, changes.Spread.UsedCorrect);
    }

    [Fact]
    public void Compare_EachPickKind_TalliedSeparately()
    {
        var used = Game(overUnderPick: "Over", overUnderGrade: PredictionGradeStatus.Incorrect, winner: "Team A", winnerGrade: PredictionGradeStatus.Correct);
        var compared = Game(overUnderPick: "Under", overUnderGrade: PredictionGradeStatus.Correct, winner: "Team B", winnerGrade: PredictionGradeStatus.Incorrect);

        var changes = PredictionPickComparer.Compare([used], [compared]);

        Assert.Equal(1, changes.OverUnder.ComparedCorrect);
        Assert.Equal(0, changes.Spread.Changed);
        Assert.Equal(1, changes.Winner.UsedCorrect);
    }

    [Fact]
    public void Compare_NullPredictions_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => PredictionPickComparer.Compare(null!, []));
        Assert.Throws<ArgumentNullException>(() => PredictionPickComparer.Compare([], null!));
    }

    [Fact]
    public void Compare_SamePicksIgnoringCase_CountsNoChange()
    {
        var used = Game(spreadPick: "Team A", spreadGrade: PredictionGradeStatus.Correct);
        var compared = Game(spreadPick: "team a", spreadGrade: PredictionGradeStatus.Correct);

        var changes = PredictionPickComparer.Compare([used], [compared]);

        Assert.Equal(0, changes.Spread.Changed);
    }

    [Theory]
    [InlineData(PredictionGradeStatus.NotApplicable)]
    [InlineData(PredictionGradeStatus.Ungraded)]
    public void Compare_UngradedSide_SkipsTheGame(PredictionGradeStatus ungraded)
    {
        var used = Game(spreadPick: "Team A", spreadGrade: ungraded);
        var compared = Game(spreadPick: "Team B", spreadGrade: PredictionGradeStatus.Correct);

        var changes = PredictionPickComparer.Compare([used], [compared]);

        Assert.Equal(0, changes.Spread.Changed);
    }

    private GamePrediction Game(string overUnderPick = "Over", PredictionGradeStatus overUnderGrade = PredictionGradeStatus.Correct, string spreadPick = "Team A", PredictionGradeStatus spreadGrade = PredictionGradeStatus.Correct, string winner = "Team A", PredictionGradeStatus winnerGrade = PredictionGradeStatus.Correct)
    {
        return new GamePrediction
        {
            AwayTeam = "Team B",
            HomeTeam = "Team A",
            MyOverUnderPick = overUnderPick,
            MySpreadPick = spreadPick,
            OverUnderGrade = overUnderGrade,
            PredictedWinner = winner,
            SpreadGrade = spreadGrade,
            WinnerGrade = winnerGrade
        };
    }
}
