using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class ConferenceMapper
{
    public static ConferenceDTO ToDTO(ConferenceInfo info)
    {
        ArgumentNullException.ThrowIfNull(info);

        return new ConferenceDTO
        {
            ID = info.ID,
            Label = info.Label,
            Name = info.Name
        };
    }

    public static ConferencesResponseDTO ToResponseDTO(IEnumerable<ConferenceInfo> conferences)
    {
        ArgumentNullException.ThrowIfNull(conferences);

        return new ConferencesResponseDTO
        {
            Conferences = conferences.Select(ToDTO)
        };
    }
}
