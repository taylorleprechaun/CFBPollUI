using CFBPoll.Core.Modules;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class AuthModuleTests
{
    private readonly AuthModule _authModule;

    public AuthModuleTests()
    {
        var authOptions = new AuthOptions
        {
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("testpassword"),
            Secret = "TestSecretKeyThatIsAtLeast32CharactersLong!",
            Issuer = "CFBPoll",
            ExpirationMinutes = 480
        };

        var options = new Mock<IOptions<AuthOptions>>();
        options.Setup(x => x.Value).Returns(authOptions);

        _authModule = new AuthModule(options.Object);
    }

    [Fact]
    public void Login_ValidCredentials_ReturnsSuccessWithToken()
    {
        var result = _authModule.Login("admin", "testpassword");

        Assert.True(result.Success);
        Assert.False(string.IsNullOrEmpty(result.Token));
        Assert.Equal(480 * 60, result.ExpiresIn);
    }

    [Fact]
    public void Login_InvalidUsername_ReturnsFailure()
    {
        var result = _authModule.Login("wronguser", "testpassword");

        Assert.False(result.Success);
        Assert.Empty(result.Token);
    }

    [Fact]
    public void Login_InvalidPassword_ReturnsFailure()
    {
        var result = _authModule.Login("admin", "wrongpassword");

        Assert.False(result.Success);
        Assert.Empty(result.Token);
    }

    [Fact]
    public void Login_CaseInsensitiveUsername_ReturnsSuccess()
    {
        var result = _authModule.Login("ADMIN", "testpassword");

        Assert.True(result.Success);
        Assert.False(string.IsNullOrEmpty(result.Token));
    }

    [Fact]
    public void Login_NullUsername_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentNullException>(() => _authModule.Login(null!, "testpassword"));
    }

    [Fact]
    public void Login_EmptyUsername_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => _authModule.Login("", "testpassword"));
    }

    [Fact]
    public void Login_NullPassword_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentNullException>(() => _authModule.Login("admin", null!));
    }

    [Fact]
    public void Login_EmptyPassword_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => _authModule.Login("admin", ""));
    }
}
