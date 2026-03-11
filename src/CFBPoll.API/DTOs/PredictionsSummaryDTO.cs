namespace CFBPoll.API.DTOs;

public class PredictionsSummaryDTO
{
    public DateTime CreatedAt { get; set; }
    public int GameCount { get; set; }
    public bool IsPublished { get; set; }
    public int Season { get; set; }
    public int Week { get; set; }
}
