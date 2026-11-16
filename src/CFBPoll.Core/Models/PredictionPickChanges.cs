namespace CFBPoll.Core.Models;

/// <summary>
/// The changed picks between two sets of predictions for the same games, per kind of pick.
/// </summary>
public class PredictionPickChanges
{
    public PredictionPickChange OverUnder { get; set; } = new();
    public PredictionPickChange Spread { get; set; } = new();
    public PredictionPickChange Winner { get; set; } = new();
}
