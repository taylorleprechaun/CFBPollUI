using CFBPoll.Core.Services;
using Microsoft.Kiota.Abstractions.Authentication;
using Xunit;

namespace CFBPoll.Core.Tests.Services;

public class CFBDataServiceTests
{
    [Fact]
    public void Constructor_WithValidApiKey_CreatesInstance()
    {
        var service = new CFBDataService("test-api-key");

        Assert.NotNull(service);
    }

    [Fact]
    public void Constructor_WithMinimumYear_CreatesInstance()
    {
        var service = new CFBDataService("test-api-key", 2010);

        Assert.NotNull(service);
    }

    [Fact]
    public void Constructor_UsesDefaultMinimumYear()
    {
        var service = new CFBDataService("test-api-key");

        Assert.NotNull(service);
    }
}

public class StaticAccessTokenProviderTests
{
    [Fact]
    public void Constructor_WithValidToken_CreatesInstance()
    {
        var provider = new StaticAccessTokenProvider("test-token");

        Assert.NotNull(provider);
    }

    [Fact]
    public void Constructor_WithNullToken_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new StaticAccessTokenProvider(null!));
    }

    [Fact]
    public async Task GetAuthorizationTokenAsync_ReturnsProvidedToken()
    {
        var expectedToken = "my-secret-token";
        var provider = new StaticAccessTokenProvider(expectedToken);

        var result = await provider.GetAuthorizationTokenAsync(new Uri("https://api.example.com"));

        Assert.Equal(expectedToken, result);
    }

    [Fact]
    public async Task GetAuthorizationTokenAsync_ReturnsSameTokenForDifferentUris()
    {
        var expectedToken = "consistent-token";
        var provider = new StaticAccessTokenProvider(expectedToken);

        var result1 = await provider.GetAuthorizationTokenAsync(new Uri("https://api1.example.com"));
        var result2 = await provider.GetAuthorizationTokenAsync(new Uri("https://api2.example.com"));

        Assert.Equal(expectedToken, result1);
        Assert.Equal(expectedToken, result2);
    }

    [Fact]
    public async Task GetAuthorizationTokenAsync_WithAdditionalContext_ReturnsToken()
    {
        var expectedToken = "context-token";
        var provider = new StaticAccessTokenProvider(expectedToken);
        var additionalContext = new Dictionary<string, object> { { "key", "value" } };

        var result = await provider.GetAuthorizationTokenAsync(
            new Uri("https://api.example.com"),
            additionalContext);

        Assert.Equal(expectedToken, result);
    }

    [Fact]
    public async Task GetAuthorizationTokenAsync_WithCancellationToken_ReturnsToken()
    {
        var expectedToken = "cancellable-token";
        var provider = new StaticAccessTokenProvider(expectedToken);
        using var cts = new CancellationTokenSource();

        var result = await provider.GetAuthorizationTokenAsync(
            new Uri("https://api.example.com"),
            cancellationToken: cts.Token);

        Assert.Equal(expectedToken, result);
    }

    [Fact]
    public void AllowedHostsValidator_IsNotNull()
    {
        var provider = new StaticAccessTokenProvider("test-token");

        Assert.NotNull(provider.AllowedHostsValidator);
    }

    [Fact]
    public void AllowedHostsValidator_IsOfCorrectType()
    {
        var provider = new StaticAccessTokenProvider("test-token");

        Assert.IsType<AllowedHostsValidator>(provider.AllowedHostsValidator);
    }
}
