using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class WeekMapper
{
    public static WeekDTO ToDTO(WeekInfo weekInfo)
    {
        ArgumentNullException.ThrowIfNull(weekInfo);

        return new WeekDTO
        {
            Label = weekInfo.Label,
            WeekNumber = weekInfo.WeekNumber
        };
    }

    public static WeeksResponseDTO ToResponseDTO(int season, IEnumerable<WeekInfo> weeks)
    {
        ArgumentNullException.ThrowIfNull(weeks);

        return new WeeksResponseDTO
        {
            Season = season,
            Weeks = weeks.Select(ToDTO)
        };
    }
}
