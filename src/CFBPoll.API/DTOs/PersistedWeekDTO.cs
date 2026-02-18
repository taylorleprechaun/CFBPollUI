namespace CFBPoll.API.DTOs;

public class PersistedWeekDTO
{
    public DateTime CreatedAt { get; set; }
    public bool Published { get; set; }
    public int Season { get; set; }
    public int Week { get; set; }
}
