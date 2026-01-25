namespace CFBPoll.Core.Models;

public class Game
{
    public AdvancedGameStats? AdvancedStats { get; set; }
    public int? AwayPoints { get; set; }
    public string? AwayTeam { get; set; }
    public long? GameID { get; set; }
    public int? HomePoints { get; set; }
    public string? HomeTeam { get; set; }
    public bool NeutralSite { get; set; }
    public string? SeasonType { get; set; }
    public int? Week { get; set; }
}
