namespace CFBPoll.Core.Models;

public class LoginResult
{
    public int ExpiresIn { get; set; }
    public bool Success { get; set; }
    public string Token { get; set; } = string.Empty;
}
