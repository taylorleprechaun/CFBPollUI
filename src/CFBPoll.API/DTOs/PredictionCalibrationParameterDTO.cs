namespace CFBPoll.API.DTOs;

public class PredictionCalibrationParameterDTO
{
    public double DefaultValue { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public double Max { get; set; }
    public double Min { get; set; }
    public double Step { get; set; }
}
