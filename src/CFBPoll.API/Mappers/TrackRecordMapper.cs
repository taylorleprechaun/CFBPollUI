using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class TrackRecordMapper
{
    public static TrackRecordResponseDTO ToResponseDTO(TrackRecordResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new TrackRecordResponseDTO
        {
            OverallOverUnder = ToDTO(result.OverallOverUnder),
            OverallSpread = ToDTO(result.OverallSpread),
            OverallWinner = ToDTO(result.OverallWinner),
            Weeks = result.Weeks.Select(ToDTO)
        };
    }

    public static TrackRecordTotalsDTO ToDTO(TrackRecordTotals totals)
    {
        ArgumentNullException.ThrowIfNull(totals);

        return new TrackRecordTotalsDTO
        {
            Correct = totals.Correct,
            Incorrect = totals.Incorrect,
            Push = totals.Push
        };
    }

    public static TrackRecordWeekDTO ToDTO(TrackRecordWeek week)
    {
        ArgumentNullException.ThrowIfNull(week);

        return new TrackRecordWeekDTO
        {
            OverUnder = ToDTO(week.OverUnder),
            Season = week.Season,
            Spread = ToDTO(week.Spread),
            Week = week.Week,
            Winner = ToDTO(week.Winner)
        };
    }
}
