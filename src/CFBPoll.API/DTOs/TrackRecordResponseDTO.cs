namespace CFBPoll.API.DTOs;

public class TrackRecordResponseDTO
{
    public double? OverallMarginBias { get; set; }
    public double? OverallMarginRMSE { get; set; }
    public TrackRecordTotalsDTO OverallOverUnder { get; set; } = new();
    public TrackRecordTotalsDTO OverallSpread { get; set; } = new();
    public TrackRecordTotalsDTO OverallWinner { get; set; } = new();
    public IEnumerable<TrackRecordWeekDTO> Weeks { get; set; } = [];
}
