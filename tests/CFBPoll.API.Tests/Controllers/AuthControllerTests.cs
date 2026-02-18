using CFBPoll.API.Controllers;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IAuthModule> _mockAuthModule;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mockAuthModule = new Mock<IAuthModule>();
        var logger = new Mock<ILogger<AuthController>>();

        _controller = new AuthController(_mockAuthModule.Object, logger.Object);
    }

    [Fact]
    public void Login_ValidCredentials_ReturnsToken()
    {
        _mockAuthModule
            .Setup(x => x.Login("admin", "testpassword"))
            .Returns(new LoginResult
            {
                Success = true,
                Token = "test-jwt-token",
                ExpiresIn = 28800
            });

        var request = new LoginRequestDTO
        {
            Username = "admin",
            Password = "testpassword"
        };

        var result = _controller.Login(request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<LoginResponseDTO>(okResult.Value);
        Assert.Equal("test-jwt-token", response.Token);
        Assert.Equal(28800, response.ExpiresIn);
    }

    [Fact]
    public void Login_InvalidUsername_ReturnsUnauthorized()
    {
        _mockAuthModule
            .Setup(x => x.Login("wronguser", "testpassword"))
            .Returns(new LoginResult { Success = false });

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
        _mockAuthModule
            .Setup(x => x.Login("admin", "wrongpassword"))
            .Returns(new LoginResult { Success = false });

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
        _mockAuthModule
            .Setup(x => x.Login("ADMIN", "testpassword"))
            .Returns(new LoginResult
            {
                Success = true,
                Token = "test-jwt-token",
                ExpiresIn = 28800
            });

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
