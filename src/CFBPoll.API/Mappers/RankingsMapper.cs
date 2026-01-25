using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class RankingsMapper
{
    public static RankingsResponseDTO ToResponseDTO(RankingsResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new RankingsResponseDTO
        {
            Rankings = result.Rankings.Select(ToDTO),
            Season = result.Season,
            Week = result.Week
        };
    }

    public static RankedTeamDTO ToDTO(RankedTeam team)
    {
        ArgumentNullException.ThrowIfNull(team);

        return new RankedTeamDTO
        {
            Conference = team.Conference,
            Details = ToDTO(team.Details),
            Division = team.Division,
            LogoURL = team.LogoURL,
            Losses = team.Losses,
            Rank = team.Rank,
            Rating = team.Rating,
            Record = $"{team.Wins}-{team.Losses}",
            SOSRanking = team.SOSRanking,
            TeamName = team.TeamName,
            WeightedSOS = team.WeightedSOS,
            Wins = team.Wins
        };
    }

    public static TeamDetailsDTO ToDTO(TeamDetails details)
    {
        ArgumentNullException.ThrowIfNull(details);

        return new TeamDetailsDTO
        {
            Away = ToDTO(details.Away),
            Home = ToDTO(details.Home),
            Neutral = ToDTO(details.Neutral),
            VsRank101Plus = ToDTO(details.VsRank101Plus),
            VsRank11To25 = ToDTO(details.VsRank11To25),
            VsRank1To10 = ToDTO(details.VsRank1To10),
            VsRank26To50 = ToDTO(details.VsRank26To50),
            VsRank51To100 = ToDTO(details.VsRank51To100)
        };
    }

    public static RecordDTO ToDTO(Record record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return new RecordDTO
        {
            Losses = record.Losses,
            Wins = record.Wins
        };
    }
}
