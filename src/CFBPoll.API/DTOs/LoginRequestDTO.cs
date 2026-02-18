namespace CFBPoll.API.DTOs;

public class LoginRequestDTO
{
    public string Password { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
}
