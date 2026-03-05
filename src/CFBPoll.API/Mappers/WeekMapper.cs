using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class WeekMapper
{
    public static WeekDTO ToDTO(WeekInfo weekInfo, IReadOnlySet<int>? publishedWeekNumbers = null)
    {
        ArgumentNullException.ThrowIfNull(weekInfo);

        return new WeekDTO
        {
            Label = weekInfo.Label,
            RankingsPublished = publishedWeekNumbers?.Contains(weekInfo.WeekNumber) ?? false,
            WeekNumber = weekInfo.WeekNumber
        };
    }

    public static WeeksResponseDTO ToResponseDTO(int season, IEnumerable<WeekInfo> weeks, IReadOnlySet<int>? publishedWeekNumbers = null)
    {
        ArgumentNullException.ThrowIfNull(weeks);

        return new WeeksResponseDTO
        {
            Season = season,
            Weeks = weeks.Select(w => ToDTO(w, publishedWeekNumbers))
        };
    }
}
