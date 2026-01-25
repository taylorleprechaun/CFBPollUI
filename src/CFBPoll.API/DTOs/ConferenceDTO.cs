namespace CFBPoll.API.DTOs;

public class ConferenceDTO
{
    public int ID { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class ConferencesResponseDTO
{
    public IEnumerable<ConferenceDTO> Conferences { get; set; } = [];
}
