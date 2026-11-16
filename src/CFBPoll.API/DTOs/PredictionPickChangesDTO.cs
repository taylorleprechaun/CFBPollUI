namespace CFBPoll.API.DTOs;

public class PredictionPickChangesDTO
{
    public PredictionPickChangeDTO OverUnder { get; set; } = new();
    public PredictionPickChangeDTO Spread { get; set; } = new();
    public PredictionPickChangeDTO Winner { get; set; } = new();
}
