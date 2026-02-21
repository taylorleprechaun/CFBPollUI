namespace CFBPoll.API.DTOs;

public class AllTimeEntryDTO
{
    public int AllTimeRank { get; set; }
    public string LogoURL { get; set; } = string.Empty;
    public int Losses { get; set; }
    public int Rank { get; set; }
    public double Rating { get; set; }
    public string Record { get; set; } = string.Empty;
    public int Season { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public double WeightedSOS { get; set; }
    public int Week { get; set; }
    public int Wins { get; set; }
}
