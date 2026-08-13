using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using CFBPoll.Core.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class RatingAlgorithmResolverTests
{
    private readonly RatingAlgorithmResolver _resolver;
    private readonly RatingModule _v1;
    private readonly RatingModuleV2 _v2;

    public RatingAlgorithmResolverTests()
    {
        var mockDataService = new Mock<ICFBDataService>();
        var options = Microsoft.Extensions.Options.Options.Create(new HistoricalDataOptions { MinimumYear = 2002 });
        _v1 = new RatingModule(mockDataService.Object, options);
        _v2 = new RatingModuleV2(_v1);
        _resolver = new RatingAlgorithmResolver(_v1, _v2);
    }

    [Fact]
    public void Constructor_NullV1_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new RatingAlgorithmResolver(null!, _v2));
    }

    [Fact]
    public void Constructor_NullV2_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new RatingAlgorithmResolver(_v1, null!));
    }

    [Fact]
    public void Resolve_WithUnknownVersion_ThrowsArgumentOutOfRangeException()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => _resolver.Resolve((RatingAlgorithmVersion)99));
    }

    [Fact]
    public void Resolve_WithV1Version_ReturnsV1Instance()
    {
        var result = _resolver.Resolve(RatingAlgorithmVersion.V1);

        Assert.Same(_v1, result);
    }

    [Fact]
    public void Resolve_WithV2Version_ReturnsV2Instance()
    {
        var result = _resolver.Resolve(RatingAlgorithmVersion.V2);

        Assert.Same(_v2, result);
    }

    [Fact]
    public void ResolveForSeason_WithSeasonBelowThreshold_ReturnsV1Instance()
    {
        var result = _resolver.ResolveForSeason(2024);

        Assert.Same(_v1, result);
    }

    [Fact]
    public void ResolveVersionForSeason_WithSeasonAtThreshold_ReturnsV2()
    {
        var result = _resolver.ResolveVersionForSeason(int.MaxValue);

        Assert.Equal(RatingAlgorithmVersion.V2, result);
    }

    [Fact]
    public void ResolveVersionForSeason_WithSeasonBelowThreshold_ReturnsV1()
    {
        var result = _resolver.ResolveVersionForSeason(2024);

        Assert.Equal(RatingAlgorithmVersion.V1, result);
    }
}
