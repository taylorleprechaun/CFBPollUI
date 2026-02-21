namespace CFBPoll.API.DTOs;

public class AllTimeResponseDTO
{
    public IEnumerable<AllTimeEntryDTO> BestTeams { get; set; } = [];
    public IEnumerable<AllTimeEntryDTO> HardestSchedules { get; set; } = [];
    public IEnumerable<AllTimeEntryDTO> WorstTeams { get; set; } = [];
}
