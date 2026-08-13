namespace CFBPoll.API.DTOs;

public class ExperimentalCalculateResponseDTO
{
    public string AlgorithmVersion { get; set; } = string.Empty;
    public RankingsResponseDTO Rankings { get; set; } = new();
}
