namespace CFBPoll.Core.Models;

public class SeasonExperimentalPredictionsWeek
{
    public PredictionRecordSummary Summary { get; set; } = new();
    public int Week { get; set; }
}
