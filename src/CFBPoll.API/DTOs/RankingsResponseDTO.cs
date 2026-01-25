namespace CFBPoll.API.DTOs;

public class RankingsResponseDTO
{
    public int Season { get; set; }
    public int Week { get; set; }
    public IEnumerable<RankedTeamDTO> Rankings { get; set; } = [];
}
