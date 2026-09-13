namespace CFBPoll.API.DTOs;

public class IncompleteGamesResponseDTO
{
    public IEnumerable<IncompleteGameDTO> Games { get; set; } = [];
    public int Season { get; set; }
    public int Week { get; set; }
}
