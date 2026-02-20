using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.Core.Tests.Models;

public class StatValueTests
{
    [Fact]
    public void StatValue_DoublePropertyCanBeSetAndRetrieved()
    {
        var stat = new StatValue { Double = 42.5 };

        Assert.Equal(42.5, stat.Double);
    }

    [Fact]
    public void StatValue_StringPropertyCanBeSetAndRetrieved()
    {
        var stat = new StatValue { String = "3rd" };

        Assert.Equal("3rd", stat.String);
    }

    [Fact]
    public void StatValue_PropertiesDefaultToNull()
    {
        var stat = new StatValue();

        Assert.Null(stat.Double);
        Assert.Null(stat.String);
    }

    [Fact]
    public void StatValue_BothPropertiesCanBeSet()
    {
        var stat = new StatValue
        {
            Double = 15.3,
            String = "15.3"
        };

        Assert.Equal(15.3, stat.Double);
        Assert.Equal("15.3", stat.String);
    }
}
