namespace CFBPoll.API.DTOs;

public class CompletedGamesResponseDTO
{
    public IEnumerable<CompletedGameDTO> Games { get; set; } = [];
    public int Season { get; set; }
    public int Week { get; set; }
}
