namespace CFBPoll.Core.Models;

public class AdvancedGameStats
{
    public AdvancedGameStatsUnit? Defense { get; set; }
    public long? GameID { get; set; }
    public AdvancedGameStatsUnit? Offense { get; set; }
    public string? Opponent { get; set; }
    public string? Team { get; set; }
    public int? Week { get; set; }
}

public class AdvancedGameStatsUnit
{
    public int? Drives { get; set; }
    public double? Explosiveness { get; set; }
    public double? LineYards { get; set; }
    public double? LineYardsTotal { get; set; }
    public double? OpenFieldYards { get; set; }
    public double? OpenFieldYardsTotal { get; set; }
    public double? PassingDownsExplosiveness { get; set; }
    public double? PassingDownsPPA { get; set; }
    public double? PassingDownsSuccessRate { get; set; }
    public double? PassingPlays { get; set; }
    public double? PassingPPA { get; set; }
    public int? Plays { get; set; }
    public double? PowerSuccess { get; set; }
    public double? PPA { get; set; }
    public double? RushingPlays { get; set; }
    public double? RushingPPA { get; set; }
    public double? SecondLevelYards { get; set; }
    public double? SecondLevelYardsTotal { get; set; }
    public double? StandardDownsExplosiveness { get; set; }
    public double? StandardDownsPPA { get; set; }
    public double? StandardDownsSuccessRate { get; set; }
    public double? StuffRate { get; set; }
    public double? SuccessRate { get; set; }
    public double? TotalPPA { get; set; }
}
