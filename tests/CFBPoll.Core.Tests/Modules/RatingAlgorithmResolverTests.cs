using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using CFBPoll.Core.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class RatingAlgorithmResolverTests
{
    private readonly RatingModule _legacy;
    private readonly RatingAlgorithmResolver _resolver;

    public RatingAlgorithmResolverTests()
    {
        var mockDataService = new Mock<ICFBDataService>();
        var options = Microsoft.Extensions.Options.Options.Create(new HistoricalDataOptions { MinimumYear = 2002 });
        _legacy = new RatingModule(mockDataService.Object, options);
        _resolver = new RatingAlgorithmResolver(_legacy);
    }

    [Fact]
    public void Constructor_NullLegacy_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new RatingAlgorithmResolver(null!));
    }

    [Fact]
    public void Resolve_WithLegacyVersion_ReturnsLegacyInstance()
    {
        var result = _resolver.Resolve(RatingAlgorithmVersion.Legacy);

        Assert.Same(_legacy, result);
    }

    [Fact]
    public void Resolve_WithUnknownVersion_ThrowsArgumentOutOfRangeException()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => _resolver.Resolve((RatingAlgorithmVersion)99));
    }

    [Fact]
    public void Resolve_WithV2Version_ThrowsNotSupportedException()
    {
        Assert.Throws<NotSupportedException>(() => _resolver.Resolve(RatingAlgorithmVersion.V2));
    }

    [Fact]
    public void ResolveForSeason_WithSeasonBelowThreshold_ReturnsLegacyInstance()
    {
        var result = _resolver.ResolveForSeason(2024);

        Assert.Same(_legacy, result);
    }

    [Fact]
    public void ResolveVersionForSeason_WithSeasonAtThreshold_ReturnsV2()
    {
        var result = _resolver.ResolveVersionForSeason(int.MaxValue);

        Assert.Equal(RatingAlgorithmVersion.V2, result);
    }

    [Fact]
    public void ResolveVersionForSeason_WithSeasonBelowThreshold_ReturnsLegacy()
    {
        var result = _resolver.ResolveVersionForSeason(2024);

        Assert.Equal(RatingAlgorithmVersion.Legacy, result);
    }
}
