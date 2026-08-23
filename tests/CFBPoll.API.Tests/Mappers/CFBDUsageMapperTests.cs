using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class CFBDUsageMapperTests
{
    [Fact]
    public void ToDTO_MapsAllProperties()
    {
        var usage = new CFBDUsage
        {
            MonthlyLimit = 1000,
            RemainingCalls = 900,
            ResetAt = new DateTime(2026, 9, 1),
            TierName = "Patron",
            TopEndpoints = [new CFBDTopEndpoint { Endpoint = "/games", RequestCount = 42 }],
            TotalRequestsInWindow = 100,
            UsedCalls = 100
        };

        var result = CFBDUsageMapper.ToDTO(usage);

        Assert.Equal(1000, result.MonthlyLimit);
        Assert.Equal(900, result.RemainingCalls);
        Assert.Equal(new DateTime(2026, 9, 1), result.ResetAt);
        Assert.Equal("Patron", result.TierName);
        Assert.Equal(100, result.TotalRequestsInWindow);
        Assert.Equal(100, result.UsedCalls);

        var endpoint = Assert.Single(result.TopEndpoints);
        Assert.Equal("/games", endpoint.Endpoint);
        Assert.Equal(42, endpoint.RequestCount);
    }

    [Fact]
    public void ToDTO_WithEmptyTopEndpoints_ReturnsEmptyList()
    {
        var usage = new CFBDUsage { TopEndpoints = [] };

        var result = CFBDUsageMapper.ToDTO(usage);

        Assert.Empty(result.TopEndpoints);
    }

    [Fact]
    public void ToDTO_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => CFBDUsageMapper.ToDTO(null!));
    }
}
