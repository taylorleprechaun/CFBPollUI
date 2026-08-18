namespace CFBPoll.API.DTOs;

public class PredictionRecordSummaryDTO
{
    public int GradedGameCount { get; set; }
    public double? MarginBias { get; set; }
    public double? MarginMAE { get; set; }
    public double? MarginRMSE { get; set; }
    public TrackRecordTotalsDTO OverUnder { get; set; } = new();
    public TrackRecordTotalsDTO Spread { get; set; } = new();
    public TrackRecordTotalsDTO Winner { get; set; } = new();
}
