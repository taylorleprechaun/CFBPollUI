namespace CFBPoll.API.DTOs;

public class PredictionCalibrationBacktestWeekDTO
{
    public PredictionRecordSummaryDTO Candidate { get; set; } = new();
    public int Season { get; set; }
    public PredictionRecordSummaryDTO Used { get; set; } = new();
    public IDictionary<string, double> UsedValues { get; set; } = new Dictionary<string, double>();
    public int Week { get; set; }
}
