namespace CFBPoll.API.DTOs;

public class CompletedGameDTO
{
    public int? AwayPoints { get; set; }
    public string? AwayTeam { get; set; }
    public long? GameID { get; set; }
    public bool HasOverride { get; set; }
    public int? HomePoints { get; set; }
    public string? HomeTeam { get; set; }
    public string? SeasonType { get; set; }
}
