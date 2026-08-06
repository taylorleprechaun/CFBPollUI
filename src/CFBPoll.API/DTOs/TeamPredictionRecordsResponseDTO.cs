namespace CFBPoll.API.DTOs;

public class TeamPredictionRecordsResponseDTO
{
    public IEnumerable<TeamPredictionRecordDTO> Records { get; set; } = [];
    public int Season { get; set; }
}
