namespace CFBPoll.Core.Models;

public class PredictionCalibrationHistoryEntry
{
    public PredictionCalibration Calibration { get; set; } = new();
    public bool IsLocked { get; set; }
}
