namespace CFBPoll.API.DTOs;

public class PredictionCalibrationBacktestWeekDTO
{
    public PredictionRecordSummaryDTO? Candidate { get; set; }
    public int Season { get; set; }
    public PredictionRecordSummaryDTO Suggested { get; set; } = new();
    public IDictionary<string, double> SuggestedValues { get; set; } = new Dictionary<string, double>();
    public PredictionRecordSummaryDTO Used { get; set; } = new();
    public IDictionary<string, double> UsedValues { get; set; } = new Dictionary<string, double>();
    public int Week { get; set; }
}
