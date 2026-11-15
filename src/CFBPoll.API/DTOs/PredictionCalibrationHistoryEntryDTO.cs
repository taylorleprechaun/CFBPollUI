namespace CFBPoll.API.DTOs;

public class PredictionCalibrationHistoryEntryDTO
{
    public bool IsLocked { get; set; }
    public int Season { get; set; }
    public string Source { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public IDictionary<string, double> Values { get; set; } = new Dictionary<string, double>();
    public int Week { get; set; }
}
