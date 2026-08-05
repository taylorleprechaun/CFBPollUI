namespace CFBPoll.Core.Models;

public class PredictionsSummary
{
    public DateTime CreatedAt { get; set; }
    public int GameCount { get; set; }
    public DateTime? GradedAt { get; set; }
    public bool IsGraded { get; set; }
    public bool IsPublished { get; set; }
    public bool ResultsPublished { get; set; }
    public int Season { get; set; }
    public int Week { get; set; }
}
