using CFBPoll.Core.Options;
using Xunit;

namespace CFBPoll.Core.Tests.Options;

public class BettingLinesOptionsTests
{
    [Fact]
    public void PreferredProvider_CanBeSet()
    {
        var options = new BettingLinesOptions
        {
            PreferredProvider = "DraftKings"
        };

        Assert.Equal("DraftKings", options.PreferredProvider);
    }

    [Fact]
    public void PreferredProvider_DefaultsToBovada()
    {
        var options = new BettingLinesOptions();

        Assert.Equal("Bovada", options.PreferredProvider);
    }

    [Fact]
    public void SectionName_ReturnsBettingLines()
    {
        Assert.Equal("BettingLines", BettingLinesOptions.SECTION_NAME);
    }
}
