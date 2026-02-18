namespace CFBPoll.Core.Options;

public class AuthOptions
{
    public const string SectionName = "Auth";

    public int ExpirationMinutes { get; set; } = 480;
    public string Issuer { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
}
