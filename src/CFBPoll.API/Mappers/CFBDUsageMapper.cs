using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class CFBDUsageMapper
{
    public static CFBDUsageDTO ToDTO(CFBDUsage usage)
    {
        ArgumentNullException.ThrowIfNull(usage);

        return new CFBDUsageDTO
        {
            MonthlyLimit = usage.MonthlyLimit,
            RemainingCalls = usage.RemainingCalls,
            ResetAt = usage.ResetAt,
            TierName = usage.TierName,
            TopEndpoints = usage.TopEndpoints.Select(e => new CFBDTopEndpointDTO
            {
                Endpoint = e.Endpoint,
                RequestCount = e.RequestCount
            }),
            TotalRequestsInWindow = usage.TotalRequestsInWindow,
            UsedCalls = usage.UsedCalls
        };
    }
}
