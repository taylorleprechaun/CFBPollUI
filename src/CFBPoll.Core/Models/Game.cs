namespace CFBPoll.Core.Models;

public class Game
{
    public int? Week { get; set; }
    public string? HomeTeam { get; set; }
    public string? AwayTeam { get; set; }
    public int? HomePoints { get; set; }
    public int? AwayPoints { get; set; }
    public bool NeutralSite { get; set; }
    public string? SeasonType { get; set; }
}
