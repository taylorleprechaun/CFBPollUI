using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class AuthControllerTests
{
    private readonly AuthController _controller;
    private readonly AuthOptions _authOptions;

    public AuthControllerTests()
    {
        _authOptions = new AuthOptions
        {
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("testpassword"),
            Secret = "TestSecretKeyThatIsAtLeast32CharactersLong!",
            Issuer = "CFBPoll",
            ExpirationMinutes = 480
        };

        var options = new Mock<IOptions<AuthOptions>>();
        options.Setup(x => x.Value).Returns(_authOptions);

        var logger = new Mock<ILogger<AuthController>>();

        _controller = new AuthController(options.Object, logger.Object);
    }

    [Fact]
    public void Login_ValidCredentials_ReturnsToken()
    {
        var request = new LoginRequestDTO
        {
            Username = "admin",
            Password = "testpassword"
        };

        var result = _controller.Login(request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<LoginResponseDTO>(okResult.Value);
        Assert.False(string.IsNullOrEmpty(response.Token));
        Assert.Equal(480 * 60, response.ExpiresIn);
    }

    [Fact]
    public void Login_InvalidUsername_ReturnsUnauthorized()
    {
        var request = new LoginRequestDTO
        {
            Username = "wronguser",
            Password = "testpassword"
        };

        var result = _controller.Login(request);

        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }

    [Fact]
    public void Login_InvalidPassword_ReturnsUnauthorized()
    {
        var request = new LoginRequestDTO
        {
            Username = "admin",
            Password = "wrongpassword"
        };

        var result = _controller.Login(request);

        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }

    [Fact]
    public void Login_EmptyUsername_ReturnsBadRequest()
    {
        var request = new LoginRequestDTO
        {
            Username = "",
            Password = "testpassword"
        };

        var result = _controller.Login(request);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public void Login_EmptyPassword_ReturnsBadRequest()
    {
        var request = new LoginRequestDTO
        {
            Username = "admin",
            Password = ""
        };

        var result = _controller.Login(request);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public void Login_CaseInsensitiveUsername_ReturnsToken()
    {
        var request = new LoginRequestDTO
        {
            Username = "ADMIN",
            Password = "testpassword"
        };

        var result = _controller.Login(request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsType<LoginResponseDTO>(okResult.Value);
    }
}
