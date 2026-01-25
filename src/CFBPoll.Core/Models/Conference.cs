namespace CFBPoll.Core.Models;

public class Conference
{
    public int ID { get; set; }
    public string Abbreviation { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
}
