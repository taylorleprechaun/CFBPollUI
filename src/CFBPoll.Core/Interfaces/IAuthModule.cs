using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for credential validation and JWT token generation.
/// </summary>
public interface IAuthModule
{
    /// <summary>
    /// Validates credentials and generates a JWT token on success.
    /// </summary>
    /// <param name="username">The username to validate.</param>
    /// <param name="password">The password to validate.</param>
    /// <returns>Login result indicating success or failure, with a token on success.</returns>
    LoginResult Login(string username, string password);
}
