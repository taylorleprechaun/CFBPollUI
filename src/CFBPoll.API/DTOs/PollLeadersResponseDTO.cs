namespace CFBPoll.API.DTOs;

public class PollLeadersResponseDTO
{
    public IEnumerable<PollLeaderEntryDTO> AllWeeks { get; set; } = [];
    public IEnumerable<PollLeaderEntryDTO> FinalWeeksOnly { get; set; } = [];
    public int MaxAvailableSeason { get; set; }
    public int MinAvailableSeason { get; set; }
}
