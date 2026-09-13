using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class IncompleteGamesMapper
{
    public static IncompleteGameDTO ToDTO(ScheduleGame scheduleGame)
    {
        ArgumentNullException.ThrowIfNull(scheduleGame);

        return new IncompleteGameDTO
        {
            AwayTeam = scheduleGame.AwayTeam,
            HomeTeam = scheduleGame.HomeTeam,
            StartDate = scheduleGame.StartDate,
            StartTimeTbd = scheduleGame.StartTimeTbd
        };
    }

    public static IncompleteGamesResponseDTO ToResponseDTO(int season, int week, IEnumerable<ScheduleGame> games)
    {
        ArgumentNullException.ThrowIfNull(games);

        return new IncompleteGamesResponseDTO
        {
            Games = games.Select(ToDTO),
            Season = season,
            Week = week
        };
    }
}
