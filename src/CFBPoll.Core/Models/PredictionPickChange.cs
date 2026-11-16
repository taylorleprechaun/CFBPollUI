namespace CFBPoll.Core.Models;

/// <summary>
/// How many graded picks of one kind differ between two sets of predictions for the same games, and which
/// side got those games right. Picks that agree have the same result, so
/// <see cref="ComparedCorrect"/> minus <see cref="UsedCorrect"/> is the difference in correct picks.
/// </summary>
public class PredictionPickChange
{
    /// <summary>
    /// Games graded on both sides whose pick differs. Includes pushes, which neither side wins.
    /// </summary>
    public int Changed { get; set; }

    /// <summary>
    /// Changed picks the compared predictions got right.
    /// </summary>
    public int ComparedCorrect { get; set; }

    /// <summary>
    /// Changed picks the used predictions got right.
    /// </summary>
    public int UsedCorrect { get; set; }
}
