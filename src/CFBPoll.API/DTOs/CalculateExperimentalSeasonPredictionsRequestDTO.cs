namespace CFBPoll.API.DTOs;

public class CalculateExperimentalSeasonPredictionsRequestDTO
{
    public IEnumerable<int> Weeks { get; set; } = [];
}
