namespace CFBPoll.API.DTOs;

public class WeeksResponseDTO
{
    public int Season { get; set; }
    public IEnumerable<WeekDTO> Weeks { get; set; } = [];
}
