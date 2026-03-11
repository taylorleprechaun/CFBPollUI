namespace CFBPoll.Core.Models;

public class PredictionsResult
{
    public IReadOnlyList<GamePrediction> Predictions { get; set; } = [];
    public int Season { get; set; }
    public int Week { get; set; }
}
