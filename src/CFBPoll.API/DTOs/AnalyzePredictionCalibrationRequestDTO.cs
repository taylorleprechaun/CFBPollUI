namespace CFBPoll.API.DTOs;

public class AnalyzePredictionCalibrationRequestDTO
{
    public int BacktestWeeks { get; set; } = 4;

    /// <summary>
    /// Values to evaluate. Omit to evaluate the suggestion.
    /// </summary>
    public IDictionary<string, double>? Values { get; set; }
}
