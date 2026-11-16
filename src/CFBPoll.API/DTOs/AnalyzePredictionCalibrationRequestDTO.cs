namespace CFBPoll.API.DTOs;

public class AnalyzePredictionCalibrationRequestDTO
{
    /// <summary>
    /// Extra values to grade every week with. Omit for none.
    /// </summary>
    public IDictionary<string, double>? Values { get; set; }
}
