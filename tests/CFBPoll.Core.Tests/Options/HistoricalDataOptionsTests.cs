using CFBPoll.Core.Options;
using Xunit;

namespace CFBPoll.Core.Tests.Options;

public class HistoricalDataOptionsTests
{
    [Fact]
    public void SectionName_ReturnsHistoricalData()
    {
        Assert.Equal("HistoricalData", HistoricalDataOptions.SectionName);
    }

    [Fact]
    public void MinimumYear_DefaultsTo2002()
    {
        var options = new HistoricalDataOptions();

        Assert.Equal(2002, options.MinimumYear);
    }

    [Fact]
    public void MinimumYear_CanBeSet()
    {
        var options = new HistoricalDataOptions
        {
            MinimumYear = 2010
        };

        Assert.Equal(2010, options.MinimumYear);
    }
}
