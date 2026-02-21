namespace CFBPoll.Core.Models;

public class AllTimeEntry
{
    public int AllTimeRank { get; set; }
    public string LogoURL { get; set; } = string.Empty;
    public int Losses { get; set; }
    public int Rank { get; set; }
    public double Rating { get; set; }
    public int Season { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public double WeightedSOS { get; set; }
    public int Week { get; set; }
    public int Wins { get; set; }
}
