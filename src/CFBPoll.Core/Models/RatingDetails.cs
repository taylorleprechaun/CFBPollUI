namespace CFBPoll.Core.Models;

public class RatingDetails
{
    public int Wins { get; set; }
    public int Losses { get; set; }
    public double StrengthOfSchedule { get; set; }
    public double WeightedStrengthOfSchedule { get; set; }
    public IDictionary<string, double> RatingComponents { get; set; } = new Dictionary<string, double>();
}
