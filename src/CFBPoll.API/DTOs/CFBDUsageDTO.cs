namespace CFBPoll.API.DTOs;

public class CFBDUsageDTO
{
    public int MonthlyLimit { get; set; }
    public int RemainingCalls { get; set; }
    public DateTime ResetAt { get; set; }
    public string TierName { get; set; } = string.Empty;
    public IEnumerable<CFBDTopEndpointDTO> TopEndpoints { get; set; } = [];
    public int TotalRequestsInWindow { get; set; }
    public int UsedCalls { get; set; }
}
