using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CFBPoll.API.DTOs;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly AuthOptions _options;

    public AuthController(IOptions<AuthOptions> options, ILogger<AuthController> logger)
    {
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
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

        if (!request.Username.Equals(_options.Username, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Login attempt with invalid username: {Username}", request.Username);
            return Unauthorized(new ErrorResponseDTO { Message = "Invalid credentials", StatusCode = 401 });
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, _options.PasswordHash))
        {
            _logger.LogWarning("Login attempt with invalid password for user: {Username}", request.Username);
            return Unauthorized(new ErrorResponseDTO { Message = "Invalid credentials", StatusCode = 401 });
        }

        var token = GenerateToken();

        _logger.LogInformation("User {Username} logged in successfully", request.Username);

        return Ok(new LoginResponseDTO
        {
            ExpiresIn = _options.ExpirationMinutes * 60,
            Token = token
        });
    }

    private string GenerateToken()
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, _options.Username),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_options.ExpirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
