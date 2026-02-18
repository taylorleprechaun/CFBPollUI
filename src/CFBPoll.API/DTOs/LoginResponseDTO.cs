namespace CFBPoll.API.DTOs;

public class LoginResponseDTO
{
    public int ExpiresIn { get; set; }
    public string Token { get; set; } = string.Empty;
}
