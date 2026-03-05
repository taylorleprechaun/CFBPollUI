namespace CFBPoll.API.DTOs;

public class SnapshotDTO
{
    public DateTime CreatedAt { get; set; }
    public bool IsPublished { get; set; }
    public int Season { get; set; }
    public int Week { get; set; }
}
