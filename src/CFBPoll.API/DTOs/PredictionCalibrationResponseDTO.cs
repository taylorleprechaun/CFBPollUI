namespace CFBPoll.API.DTOs;

public class PredictionCalibrationResponseDTO
{
    public int? CarriedFromSeason { get; set; }
    public int? CarriedFromWeek { get; set; }
    public bool DraftUsesDifferentValues { get; set; }
    public bool IsLocked { get; set; }
    public bool IsStored { get; set; }
    public bool IsSupported { get; set; }
    public IEnumerable<PredictionCalibrationParameterDTO> Parameters { get; set; } = [];
    public int Season { get; set; }
    public string? Source { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public IDictionary<string, double> Values { get; set; } = new Dictionary<string, double>();
    public int Week { get; set; }
}
