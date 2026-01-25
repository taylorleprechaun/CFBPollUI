namespace CFBPoll.Core.Models;

public class CalendarWeek
{
    public int Week { get; set; }
    public string SeasonType { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
