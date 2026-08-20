namespace CFBPoll.API.DTOs;

public class SeasonExperimentalPredictionsWeekDTO
{
    public PredictionRecordSummaryDTO Summary { get; set; } = new();
    public int Week { get; set; }
}
