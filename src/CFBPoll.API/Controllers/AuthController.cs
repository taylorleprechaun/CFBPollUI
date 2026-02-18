using CFBPoll.API.DTOs;
using CFBPoll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthModule _authModule;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthModule authModule, ILogger<AuthController> logger)
    {
        _authModule = authModule ?? throw new ArgumentNullException(nameof(authModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Authenticates the user and returns a JWT token.
    /// </summary>
    /// <param name="request">Login credentials.</param>
    /// <returns>JWT token on success, 401 on failure.</returns>
    [HttpPost("login")]
    public ActionResult<LoginResponseDTO> Login([FromBody] LoginRequestDTO request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new ErrorResponseDTO { Message = "Username and password are required", StatusCode = 400 });

        var result = _authModule.Login(request.Username, request.Password);

        if (!result.Success)
        {
            _logger.LogWarning("Login attempt failed for username: {Username}", request.Username);
            return Unauthorized(new ErrorResponseDTO { Message = "Invalid credentials", StatusCode = 401 });
        }

        _logger.LogInformation("User {Username} logged in successfully", request.Username);

        return Ok(new LoginResponseDTO
        {
            ExpiresIn = result.ExpiresIn,
            Token = result.Token
        });
    }
}
