namespace CFBPoll.API.DTOs;

public class RankedTeamDTO
{
    public string Conference { get; set; } = string.Empty;
    public TeamDetailsDTO? Details { get; set; }
    public string Division { get; set; } = string.Empty;
    public string LogoURL { get; set; } = string.Empty;
    public int Losses { get; set; }
    public int Rank { get; set; }
    public double Rating { get; set; }
    public string Record { get; set; } = string.Empty;
    public int SOSRanking { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public double WeightedSOS { get; set; }
    public int Wins { get; set; }
}

public class RecordDTO
{
    public int Losses { get; set; }
    public int Wins { get; set; }
}

public class TeamDetailsDTO
{
    public RecordDTO Away { get; set; } = new();
    public RecordDTO Home { get; set; } = new();
    public RecordDTO Neutral { get; set; } = new();
    public RecordDTO VsRank101Plus { get; set; } = new();
    public RecordDTO VsRank11To25 { get; set; } = new();
    public RecordDTO VsRank1To10 { get; set; } = new();
    public RecordDTO VsRank26To50 { get; set; } = new();
    public RecordDTO VsRank51To100 { get; set; } = new();
}
