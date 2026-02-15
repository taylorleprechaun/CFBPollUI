namespace CFBPoll.Core.Models;

public class TeamInfo
{
    public string AltColor { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Conference { get; set; } = string.Empty;
    public string Division { get; set; } = string.Empty;
    public IEnumerable<Game> Games { get; set; } = [];
    public string LogoURL { get; set; } = string.Empty;
    public int Losses { get; set; }
    public string Name { get; set; } = string.Empty;
    public IEnumerable<TeamStat> TeamStats { get; set; } = [];
    public int Wins { get; set; }
}
