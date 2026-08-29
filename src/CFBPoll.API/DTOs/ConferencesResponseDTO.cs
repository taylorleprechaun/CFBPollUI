namespace CFBPoll.API.DTOs;

public class ConferencesResponseDTO
{
    public IEnumerable<ConferenceDTO> Conferences { get; set; } = [];
}
