namespace CFBPoll.API.DTOs;

public class TrackRecordResponseDTO
{
    public TrackRecordTotalsDTO OverallOverUnder { get; set; } = new();
    public TrackRecordTotalsDTO OverallSpread { get; set; } = new();
    public TrackRecordTotalsDTO OverallWinner { get; set; } = new();
    public IEnumerable<TrackRecordWeekDTO> Weeks { get; set; } = [];
}
