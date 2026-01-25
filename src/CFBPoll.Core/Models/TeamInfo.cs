namespace CFBPoll.Core.Models;

public class TeamInfo
{
    public string Name { get; set; } = string.Empty;
    public string Conference { get; set; } = string.Empty;
    public string Division { get; set; } = string.Empty;
    public string LogoURL { get; set; } = string.Empty;
    public int Wins { get; set; }
    public int Losses { get; set; }
    public IEnumerable<Game> Games { get; set; } = [];
}
