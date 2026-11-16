namespace CFBPoll.API.DTOs;

public class SavePredictionCalibrationRequestDTO
{
    /// <summary>
    /// True when the values were accepted from a suggestion rather than typed in.
    /// </summary>
    public bool IsAcceptedSuggestion { get; set; }

    public IDictionary<string, double>? Values { get; set; }
}
