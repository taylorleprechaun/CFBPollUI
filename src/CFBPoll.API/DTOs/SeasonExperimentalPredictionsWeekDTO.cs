namespace CFBPoll.API.DTOs;

public class SeasonExperimentalPredictionsWeekDTO
{
    public IDictionary<string, double>? AppliedCalibration { get; set; }
    public PredictionRecordSummaryDTO Summary { get; set; } = new();
    public int Week { get; set; }
}
