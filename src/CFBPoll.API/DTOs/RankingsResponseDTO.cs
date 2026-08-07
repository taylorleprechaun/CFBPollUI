namespace CFBPoll.API.DTOs;

public class RankingsResponseDTO
{
    public IEnumerable<RankedTeamDTO> Rankings { get; set; } = [];
    public int Season { get; set; }
    public int Week { get; set; }
}
