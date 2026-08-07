using System.Text;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace CFBPoll.API.Extensions;

public static class AuthenticationServiceExtensions
{
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<AuthOptions>(configuration.GetSection(AuthOptions.SECTION_NAME));

        var secret = configuration[$"{AuthOptions.SECTION_NAME}:Secret"];
        var issuer = configuration[$"{AuthOptions.SECTION_NAME}:Issuer"];

        if (string.IsNullOrEmpty(secret))
            throw new InvalidOperationException($"JWT configuration '{AuthOptions.SECTION_NAME}:Secret' is required but was not found. Ensure appsettings-private.json is present.");

        if (string.IsNullOrEmpty(issuer))
            throw new InvalidOperationException($"JWT configuration '{AuthOptions.SECTION_NAME}:Issuer' is required but was not found. Ensure appsettings-private.json is present.");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ClockSkew = TimeSpan.FromMinutes(1),
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ValidateAudience = true,
                ValidateIssuer = true,
                ValidateIssuerSigningKey = true,
                ValidateLifetime = true,
                ValidAudience = issuer,
                ValidIssuer = issuer
            };
        });

        services.AddAuthorization();

        return services;
    }
}
