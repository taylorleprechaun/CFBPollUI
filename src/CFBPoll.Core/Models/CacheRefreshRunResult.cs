namespace CFBPoll.Core.Models;

public class CacheRefreshRunResult
{
    public int Failed { get; set; }
    public int KeptExisting { get; set; }
    public int Refreshed { get; set; }
}
