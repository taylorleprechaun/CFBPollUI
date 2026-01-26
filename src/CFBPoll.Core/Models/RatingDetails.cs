namespace CFBPoll.Core.Models;

public class RatingDetails
{
    public int Losses { get; set; }
    public double Rating { get; set; }
    public IDictionary<string, double> RatingComponents { get; set; } = new Dictionary<string, double>();
    public double StrengthOfSchedule { get; set; }
    public double WeightedStrengthOfSchedule { get; set; }
    public int Wins { get; set; }
}
