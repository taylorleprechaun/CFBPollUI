using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class AllTimeMapper
{
    public static AllTimeResponseDTO ToResponseDTO(AllTimeResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new AllTimeResponseDTO
        {
            BestTeams = result.BestTeams.Select(ToDTO),
            HardestSchedules = result.HardestSchedules.Select(ToDTO),
            WorstTeams = result.WorstTeams.Select(ToDTO)
        };
    }

    public static AllTimeEntryDTO ToDTO(AllTimeEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);

        return new AllTimeEntryDTO
        {
            AllTimeRank = entry.AllTimeRank,
            LogoURL = entry.LogoURL,
            Losses = entry.Losses,
            Rank = entry.Rank,
            Rating = entry.Rating,
            Record = $"{entry.Wins}-{entry.Losses}",
            Season = entry.Season,
            TeamName = entry.TeamName,
            WeightedSOS = entry.WeightedSOS,
            Week = entry.Week,
            Wins = entry.Wins
        };
    }
}
