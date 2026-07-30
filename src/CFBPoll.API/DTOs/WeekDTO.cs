namespace CFBPoll.API.DTOs;

public class WeekDTO
{
    public string Label { get; set; } = string.Empty;
    public bool PredictionsPublished { get; set; }
    public bool RankingsPublished { get; set; }
    public int WeekNumber { get; set; }
}
