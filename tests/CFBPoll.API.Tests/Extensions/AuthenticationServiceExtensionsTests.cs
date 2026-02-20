using System.Text;
using CFBPoll.API.Extensions;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace CFBPoll.API.Tests.Extensions;

public class AuthenticationServiceExtensionsTests
{
    [Fact]
    public void AddJwtAuthentication_RegistersAuthOptions()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration();

        services.AddJwtAuthentication(configuration);

        var provider = services.BuildServiceProvider();
        var options = provider.GetService<IOptions<AuthOptions>>();

        Assert.NotNull(options);
        Assert.Equal("testuser", options.Value.Username);
        Assert.Equal("CFBPoll", options.Value.Issuer);
    }

    [Fact]
    public void AddJwtAuthentication_RegistersAuthenticationServices()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration();

        services.AddJwtAuthentication(configuration);

        var provider = services.BuildServiceProvider();
        var authSchemeProvider = provider.GetService<IAuthenticationSchemeProvider>();

        Assert.NotNull(authSchemeProvider);
    }

    [Fact]
    public async Task AddJwtAuthentication_ConfiguresJwtBearerAsDefault()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration();

        services.AddJwtAuthentication(configuration);

        var provider = services.BuildServiceProvider();
        var authSchemeProvider = provider.GetRequiredService<IAuthenticationSchemeProvider>();
        var defaultScheme = await authSchemeProvider.GetDefaultAuthenticateSchemeAsync();

        Assert.NotNull(defaultScheme);
        Assert.Equal(JwtBearerDefaults.AuthenticationScheme, defaultScheme.Name);
    }

    [Fact]
    public void AddJwtAuthentication_ReturnsServiceCollection()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration();

        var result = services.AddJwtAuthentication(configuration);

        Assert.Same(services, result);
    }

    [Fact]
    public void AddJwtAuthentication_ConfiguresTokenValidationParameters()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration();

        services.AddJwtAuthentication(configuration);

        var provider = services.BuildServiceProvider();
        var optionsMonitor = provider.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();
        var jwtOptions = optionsMonitor.Get(JwtBearerDefaults.AuthenticationScheme);
        var tokenParams = jwtOptions.TokenValidationParameters;

        Assert.True(tokenParams.ValidateIssuer);
        Assert.True(tokenParams.ValidateAudience);
        Assert.True(tokenParams.ValidateIssuerSigningKey);
        Assert.True(tokenParams.ValidateLifetime);
        Assert.Equal("CFBPoll", tokenParams.ValidIssuer);
        Assert.Equal("CFBPoll", tokenParams.ValidAudience);
        Assert.Equal(TimeSpan.FromMinutes(1), tokenParams.ClockSkew);
        Assert.IsType<SymmetricSecurityKey>(tokenParams.IssuerSigningKey);

        var expectedKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes("TestSecretKeyThatIsAtLeast32CharactersLong!"));
        var actualKey = (SymmetricSecurityKey)tokenParams.IssuerSigningKey;
        Assert.Equal(expectedKey.Key, actualKey.Key);
    }

    [Fact]
    public void AddJwtAuthentication_MissingSecret_ThrowsInvalidOperationException()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configValues = new Dictionary<string, string?>
        {
            ["Auth:Username"] = "testuser",
            ["Auth:Issuer"] = "CFBPoll"
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        var exception = Assert.Throws<InvalidOperationException>(() =>
            services.AddJwtAuthentication(configuration));

        Assert.Contains("Secret", exception.Message);
    }

    [Fact]
    public void AddJwtAuthentication_MissingIssuer_ThrowsInvalidOperationException()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configValues = new Dictionary<string, string?>
        {
            ["Auth:Username"] = "testuser",
            ["Auth:Secret"] = "TestSecretKeyThatIsAtLeast32CharactersLong!"
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        var exception = Assert.Throws<InvalidOperationException>(() =>
            services.AddJwtAuthentication(configuration));

        Assert.Contains("Issuer", exception.Message);
    }

    private static IConfiguration BuildConfiguration()
    {
        var configValues = new Dictionary<string, string?>
        {
            ["Auth:Username"] = "testuser",
            ["Auth:PasswordHash"] = "$2a$11$test",
            ["Auth:Secret"] = "TestSecretKeyThatIsAtLeast32CharactersLong!",
            ["Auth:Issuer"] = "CFBPoll",
            ["Auth:ExpirationMinutes"] = "480"
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();
    }
}
