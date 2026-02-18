using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CFBPoll.Core.Modules;

public class AuthModule : IAuthModule
{
    private readonly AuthOptions _options;

    public AuthModule(IOptions<AuthOptions> options)
    {
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    public LoginResult Login(string username, string password)
    {
        if (!username.Equals(_options.Username, StringComparison.OrdinalIgnoreCase))
            return new LoginResult { Success = false };

        if (!BCrypt.Net.BCrypt.Verify(password, _options.PasswordHash))
            return new LoginResult { Success = false };

        var token = GenerateToken();

        return new LoginResult
        {
            ExpiresIn = _options.ExpirationMinutes * 60,
            Success = true,
            Token = token
        };
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
