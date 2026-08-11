using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class TrackRecordMapperTests
{
    [Fact]
    public void ToDTO_Totals_MapsAllProperties()
    {
        var totals = new TrackRecordTotals { Correct = 10, Incorrect = 4, Push = 2 };

        var result = TrackRecordMapper.ToDTO(totals);

        Assert.Equal(10, result.Correct);
        Assert.Equal(4, result.Incorrect);
        Assert.Equal(2, result.Push);
    }

    [Fact]
    public void ToDTO_Totals_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => TrackRecordMapper.ToDTO((TrackRecordTotals)null!));
    }

    [Fact]
    public void ToDTO_Week_MapsAllProperties()
    {
        var week = new TrackRecordWeek
        {
            MarginBias = 0.5,
            MarginGameCount = 2,
            MarginRMSE = 0.7071,
            OverUnder = new TrackRecordTotals { Correct = 3 },
            Season = 2024,
            Spread = new TrackRecordTotals { Incorrect = 2 },
            Week = 5,
            Winner = new TrackRecordTotals { Push = 1 }
        };

        var result = TrackRecordMapper.ToDTO(week);

        Assert.Equal(2024, result.Season);
        Assert.Equal(5, result.Week);
        Assert.Equal(3, result.OverUnder.Correct);
        Assert.Equal(2, result.Spread.Incorrect);
        Assert.Equal(1, result.Winner.Push);
        Assert.Equal(0.5, result.MarginBias);
        Assert.Equal(2, result.MarginGameCount);
        Assert.Equal(0.7071, result.MarginRMSE);
    }

    [Fact]
    public void ToDTO_Week_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => TrackRecordMapper.ToDTO((TrackRecordWeek)null!));
    }

    [Fact]
    public void ToResponseDTO_MapsAllProperties()
    {
        var result = new TrackRecordResult
        {
            OverallMarginBias = 0.5,
            OverallMarginRMSE = 0.7071,
            OverallOverUnder = new TrackRecordTotals { Correct = 20 },
            OverallSpread = new TrackRecordTotals { Incorrect = 15 },
            OverallWinner = new TrackRecordTotals { Correct = 30 },
            Weeks = new List<TrackRecordWeek>
            {
                new() { Season = 2024, Week = 1 },
                new() { Season = 2024, Week = 2 }
            }
        };

        var dto = TrackRecordMapper.ToResponseDTO(result);

        Assert.Equal(20, dto.OverallOverUnder.Correct);
        Assert.Equal(15, dto.OverallSpread.Incorrect);
        Assert.Equal(30, dto.OverallWinner.Correct);
        Assert.Equal(2, dto.Weeks.Count());
        Assert.Equal(0.5, dto.OverallMarginBias);
        Assert.Equal(0.7071, dto.OverallMarginRMSE);
    }

    [Fact]
    public void ToResponseDTO_PreservesWeekOrder()
    {
        var result = new TrackRecordResult
        {
            Weeks = new List<TrackRecordWeek>
            {
                new() { Season = 2023, Week = 5 },
                new() { Season = 2024, Week = 1 },
                new() { Season = 2024, Week = 3 }
            }
        };

        var dto = TrackRecordMapper.ToResponseDTO(result).Weeks.ToList();

        Assert.Equal((2023, 5), (dto[0].Season, dto[0].Week));
        Assert.Equal((2024, 1), (dto[1].Season, dto[1].Week));
        Assert.Equal((2024, 3), (dto[2].Season, dto[2].Week));
    }

    [Fact]
    public void ToResponseDTO_WithEmptyWeeks_ReturnsEmptyList()
    {
        var result = new TrackRecordResult();

        var dto = TrackRecordMapper.ToResponseDTO(result);

        Assert.Empty(dto.Weeks);
    }

    [Fact]
    public void ToResponseDTO_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => TrackRecordMapper.ToResponseDTO(null!));
    }
}
