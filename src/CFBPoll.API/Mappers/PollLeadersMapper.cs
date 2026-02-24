using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class PollLeadersMapper
{
    public static PollLeaderEntryDTO ToDTO(PollLeaderEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);

        return new PollLeaderEntryDTO
        {
            LogoURL = entry.LogoURL,
            TeamName = entry.TeamName,
            Top5Count = entry.Top5Count,
            Top10Count = entry.Top10Count,
            Top25Count = entry.Top25Count
        };
    }

    public static PollLeadersResponseDTO ToResponseDTO(PollLeadersResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new PollLeadersResponseDTO
        {
            AllWeeks = result.AllWeeks.Select(ToDTO),
            FinalWeeksOnly = result.FinalWeeksOnly.Select(ToDTO),
            MaxAvailableSeason = result.MaxAvailableSeason,
            MinAvailableSeason = result.MinAvailableSeason
        };
    }
}
