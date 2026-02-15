namespace CFBPoll.API.DTOs;

public class ErrorResponseDTO
{
    public string Message { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public string? TraceID { get; set; }
}
