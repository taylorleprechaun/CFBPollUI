using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class SeasonTrendsMapper
{
    public static SeasonTrendsResponseDTO ToResponseDTO(SeasonTrendsResult model)
    {
        ArgumentNullException.ThrowIfNull(model);

        return new SeasonTrendsResponseDTO
        {
            Season = model.Season,
            Teams = model.Teams.Select(ToTeamDTO).ToList(),
            Weeks = model.Weeks.Select(ToWeekDTO).ToList()
        };
    }

    public static SeasonTrendTeamDTO ToTeamDTO(SeasonTrendTeam model)
    {
        ArgumentNullException.ThrowIfNull(model);

        return new SeasonTrendTeamDTO
        {
            AltColor = model.AltColor,
            Color = model.Color,
            Conference = model.Conference,
            LogoURL = model.LogoURL,
            Rankings = model.Rankings.Select(ToRankingDTO).ToList(),
            TeamName = model.TeamName
        };
    }

    public static SeasonTrendRankingDTO ToRankingDTO(SeasonTrendRanking model)
    {
        ArgumentNullException.ThrowIfNull(model);

        return new SeasonTrendRankingDTO
        {
            Rank = model.Rank,
            Rating = model.Rating,
            Record = model.Record,
            WeekNumber = model.WeekNumber
        };
    }

    public static SeasonTrendWeekDTO ToWeekDTO(SeasonTrendWeek model)
    {
        ArgumentNullException.ThrowIfNull(model);

        return new SeasonTrendWeekDTO
        {
            Label = model.Label,
            WeekNumber = model.WeekNumber
        };
    }
}
