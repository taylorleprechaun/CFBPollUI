namespace CFBPoll.API.DTOs;

public class RefreshCacheResponseDTO
{
    public int FailedCount { get; set; }
    public int RefreshedCount { get; set; }
    public int Season { get; set; }
    public int Week { get; set; }
}
