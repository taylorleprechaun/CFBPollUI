using CFBPoll.Core.Models;
using CFBPoll.Core.Modules;
using OfficeOpenXml;
using Xunit;

namespace CFBPoll.Core.Tests.Modules;

public class ExcelExportModuleTests
{
    private readonly ExcelExportModule _module;

    public ExcelExportModuleTests()
    {
        _module = new ExcelExportModule();
    }

    [Fact]
    public void GeneratePredictionsWorkbook_EmptyPredictions_ProducesValidWorkbookWithHeaders()
    {
        var predictions = new PredictionsResult { Season = 2024, Week = 5, Predictions = [] };

        var bytes = _module.GeneratePredictionsWorkbook(predictions);

        using var package = new ExcelPackage(new MemoryStream(bytes));
        var worksheet = package.Workbook.Worksheets[0];

        Assert.Equal("Away Team", worksheet.Cells[1, 1].Value?.ToString());
        Assert.Equal("Home Team", worksheet.Cells[1, 2].Value?.ToString());
        Assert.Null(worksheet.Cells[2, 1].Value);
    }

    [Fact]
    public void GeneratePredictionsWorkbook_HasCorrectDataValues()
    {
        var predictions = CreatePredictionsResult();

        var bytes = _module.GeneratePredictionsWorkbook(predictions);

        using var package = new ExcelPackage(new MemoryStream(bytes));
        var worksheet = package.Workbook.Worksheets[0];

        Assert.Equal("Iowa", worksheet.Cells[2, 1].Value);
        Assert.Equal("Nebraska", worksheet.Cells[2, 2].Value);
        Assert.Equal(false, worksheet.Cells[2, 3].Value);
        Assert.Equal("Nebraska", worksheet.Cells[2, 4].Value);
        Assert.Equal(7.5, worksheet.Cells[2, 5].Value);
        Assert.Equal(21.0, worksheet.Cells[2, 6].Value);
        Assert.Equal(28.0, worksheet.Cells[2, 7].Value);
        Assert.Equal(-3.5, worksheet.Cells[2, 8].Value);
        Assert.Equal("Nebraska", worksheet.Cells[2, 9].Value);
        Assert.Equal("Correct", worksheet.Cells[2, 10].Value?.ToString());
        Assert.Equal(54.5, worksheet.Cells[2, 11].Value);
        Assert.Equal("Over", worksheet.Cells[2, 12].Value);
        Assert.Equal("Correct", worksheet.Cells[2, 13].Value?.ToString());
        Assert.Equal(21.0, worksheet.Cells[2, 14].Value);
        Assert.Equal(28.0, worksheet.Cells[2, 15].Value);
        Assert.Equal("Nebraska", worksheet.Cells[2, 16].Value);
        Assert.Equal("Correct", worksheet.Cells[2, 17].Value?.ToString());
    }

    [Fact]
    public void GeneratePredictionsWorkbook_HasCorrectHeaders()
    {
        var predictions = CreatePredictionsResult();

        var bytes = _module.GeneratePredictionsWorkbook(predictions);

        using var package = new ExcelPackage(new MemoryStream(bytes));
        var worksheet = package.Workbook.Worksheets[0];

        Assert.Equal("Away Team", worksheet.Cells[1, 1].Value?.ToString());
        Assert.Equal("Home Team", worksheet.Cells[1, 2].Value?.ToString());
        Assert.Equal("Neutral Site", worksheet.Cells[1, 3].Value?.ToString());
        Assert.Equal("Predicted Winner", worksheet.Cells[1, 4].Value?.ToString());
        Assert.Equal("Predicted Margin", worksheet.Cells[1, 5].Value?.ToString());
        Assert.Equal("Predicted Away Score", worksheet.Cells[1, 6].Value?.ToString());
        Assert.Equal("Predicted Home Score", worksheet.Cells[1, 7].Value?.ToString());
        Assert.Equal("Betting Spread", worksheet.Cells[1, 8].Value?.ToString());
        Assert.Equal("My Spread Pick", worksheet.Cells[1, 9].Value?.ToString());
        Assert.Equal("Spread Grade", worksheet.Cells[1, 10].Value?.ToString());
        Assert.Equal("Betting O/U", worksheet.Cells[1, 11].Value?.ToString());
        Assert.Equal("My O/U Pick", worksheet.Cells[1, 12].Value?.ToString());
        Assert.Equal("O/U Grade", worksheet.Cells[1, 13].Value?.ToString());
        Assert.Equal("Actual Away Score", worksheet.Cells[1, 14].Value?.ToString());
        Assert.Equal("Actual Home Score", worksheet.Cells[1, 15].Value?.ToString());
        Assert.Equal("Actual Winner", worksheet.Cells[1, 16].Value?.ToString());
        Assert.Equal("Winner Grade", worksheet.Cells[1, 17].Value?.ToString());
    }

    [Fact]
    public void GeneratePredictionsWorkbook_HasOneSheetNamedPredictions()
    {
        var predictions = CreatePredictionsResult();

        var bytes = _module.GeneratePredictionsWorkbook(predictions);

        using var package = new ExcelPackage(new MemoryStream(bytes));
        Assert.Single(package.Workbook.Worksheets);
        Assert.Equal("Predictions", package.Workbook.Worksheets[0].Name);
    }

    [Fact]
    public void GeneratePredictionsWorkbook_NullOptionalFields_LeavesCellsBlank()
    {
        var predictions = new PredictionsResult
        {
            Season = 2024,
            Week = 5,
            Predictions =
            [
                new GamePrediction
                {
                    AwayTeam = "Texas",
                    HomeTeam = "Oklahoma",
                    PredictedWinner = "Texas",
                    PredictedMargin = 3.0,
                    MySpreadPick = "Texas",
                    MyOverUnderPick = "Under"
                }
            ]
        };

        var bytes = _module.GeneratePredictionsWorkbook(predictions);

        using var package = new ExcelPackage(new MemoryStream(bytes));
        var worksheet = package.Workbook.Worksheets[0];

        Assert.Null(worksheet.Cells[2, 8].Value);
        Assert.Null(worksheet.Cells[2, 11].Value);
        Assert.Null(worksheet.Cells[2, 14].Value);
        Assert.Null(worksheet.Cells[2, 15].Value);
        Assert.Null(worksheet.Cells[2, 16].Value);
    }

    [Fact]
    public void GeneratePredictionsWorkbook_ReturnsNonEmptyBytes()
    {
        var predictions = CreatePredictionsResult();

        var result = _module.GeneratePredictionsWorkbook(predictions);

        Assert.NotNull(result);
        Assert.True(result.Length > 0);
    }

    [Fact]
    public void GeneratePredictionsWorkbook_ThrowsOnNull()
    {
        Assert.Throws<ArgumentNullException>(() => _module.GeneratePredictionsWorkbook(null!));
    }

    [Fact]
    public void GenerateRankingsWorkbook_DynamicColumnsContainNumberedGames_SortsColumnsNumerically()
    {
        var rankings = new RankingsResult
        {
            Season = 2024,
            Week = 5,
            Rankings =
            [
                new RankedTeam
                {
                    Rank = 1,
                    TeamName = "Team A",
                    Rating = 90.1234,
                    Conference = "Big Ten",
                    Division = "East",
                    Wins = 10,
                    Losses = 0,
                    StrengthOfSchedule = 0.7,
                    WeightedSOS = 0.8,
                    SOSRanking = 3,
                    RatingComponents = new Dictionary<string, double>
                    {
                        ["Game 10"] = 0.5,
                        ["Game 2"] = 0.6,
                        ["Game 1"] = 0.4
                    },
                    Details = new TeamDetails()
                }
            ]
        };

        var bytes = _module.GenerateRankingsWorkbook(rankings);

        using var package = new ExcelPackage(new MemoryStream(bytes));
        var worksheet = package.Workbook.Worksheets[0];

        Assert.Equal("Game 1", worksheet.Cells[1, 12].Value?.ToString());
        Assert.Equal("Game 2", worksheet.Cells[1, 13].Value?.ToString());
        Assert.Equal("Game 10", worksheet.Cells[1, 14].Value?.ToString());
    }

    [Fact]
    public void GenerateRankingsWorkbook_EmptyRankings_ProducesValidWorkbookWithHeaders()
    {
        var rankings = new RankingsResult
        {
            Season = 2024,
            Week = 5,
            Rankings = []
        };

        var bytes = _module.GenerateRankingsWorkbook(rankings);

        using var package = new ExcelPackage(new MemoryStream(bytes));
        var worksheet = package.Workbook.Worksheets[0];

        Assert.Equal("Ranking", worksheet.Cells[1, 1].Value?.ToString());
        Assert.Equal("Team Name", worksheet.Cells[1, 2].Value?.ToString());
        Assert.Null(worksheet.Cells[2, 1].Value);
    }

    [Fact]
    public void GenerateRankingsWorkbook_HasCorrectDataValues()
    {
        var rankings = CreateRankingsResult();

        var bytes = _module.GenerateRankingsWorkbook(rankings);

        using var package = new ExcelPackage(new MemoryStream(bytes));
        var worksheet = package.Workbook.Worksheets[0];

        Assert.Equal(1.0, worksheet.Cells[2, 1].Value);
        Assert.Equal("Team A", worksheet.Cells[2, 2].Value);
        Assert.Equal(90.1234, worksheet.Cells[2, 3].Value);
        Assert.Equal(5.0, worksheet.Cells[2, 5].Value);
        Assert.Equal(1.0, worksheet.Cells[2, 6].Value);
        Assert.Equal("Big Ten", worksheet.Cells[2, 10].Value);
        Assert.Equal("East", worksheet.Cells[2, 11].Value);
    }

    [Fact]
    public void GenerateRankingsWorkbook_HasCorrectHeaders()
    {
        var rankings = CreateRankingsResult();

        var bytes = _module.GenerateRankingsWorkbook(rankings);

        using var package = new ExcelPackage(new MemoryStream(bytes));
        var worksheet = package.Workbook.Worksheets[0];

        Assert.Equal("Ranking", worksheet.Cells[1, 1].Value?.ToString());
        Assert.Equal("Team Name", worksheet.Cells[1, 2].Value?.ToString());
        Assert.Equal("Rating", worksheet.Cells[1, 3].Value?.ToString());
        Assert.Equal("Rating %", worksheet.Cells[1, 4].Value?.ToString());
        Assert.Equal("Wins", worksheet.Cells[1, 5].Value?.ToString());
        Assert.Equal("Losses", worksheet.Cells[1, 6].Value?.ToString());
        Assert.Equal("Win %", worksheet.Cells[1, 7].Value?.ToString());
        Assert.Equal("SOS", worksheet.Cells[1, 8].Value?.ToString());
        Assert.Equal("Weighted SoS", worksheet.Cells[1, 9].Value?.ToString());
        Assert.Equal("Conference", worksheet.Cells[1, 10].Value?.ToString());
        Assert.Equal("Division", worksheet.Cells[1, 11].Value?.ToString());
    }

    [Fact]
    public void GenerateRankingsWorkbook_HasDynamicRatingComponentColumns()
    {
        var rankings = CreateRankingsResult();

        var bytes = _module.GenerateRankingsWorkbook(rankings);

        using var package = new ExcelPackage(new MemoryStream(bytes));
        var worksheet = package.Workbook.Worksheets[0];

        // Dynamic columns should be after column 11, in alphabetical order
        Assert.Equal("BaseWins", worksheet.Cells[1, 12].Value?.ToString());
        Assert.Equal("MarginFactor", worksheet.Cells[1, 13].Value?.ToString());
        Assert.Equal("SOSBonus", worksheet.Cells[1, 14].Value?.ToString());

        Assert.Equal(40.0, worksheet.Cells[2, 12].Value);
        Assert.Equal(5.0, worksheet.Cells[2, 13].Value);
        Assert.Equal(10.0, worksheet.Cells[2, 14].Value);
    }

    [Fact]
    public void GenerateRankingsWorkbook_HasOneSheetNamedRatingDetails()
    {
        var rankings = CreateRankingsResult();

        var bytes = _module.GenerateRankingsWorkbook(rankings);

        using var package = new ExcelPackage(new MemoryStream(bytes));
        Assert.Single(package.Workbook.Worksheets);
        Assert.Equal("Rating Details", package.Workbook.Worksheets[0].Name);
    }

    [Fact]
    public void GenerateRankingsWorkbook_ReturnsNonEmptyBytes()
    {
        var rankings = CreateRankingsResult();

        var result = _module.GenerateRankingsWorkbook(rankings);

        Assert.NotNull(result);
        Assert.True(result.Length > 0);
    }

    [Fact]
    public void GenerateRankingsWorkbook_TeamMissingDynamicComponent_LeavesCellBlank()
    {
        var rankings = new RankingsResult
        {
            Season = 2024,
            Week = 5,
            Rankings =
            [
                new RankedTeam
                {
                    Rank = 1,
                    TeamName = "Team A",
                    Rating = 90.1234,
                    Conference = "Big Ten",
                    Division = "East",
                    Wins = 2,
                    Losses = 0,
                    StrengthOfSchedule = 0.7,
                    WeightedSOS = 0.8,
                    SOSRanking = 3,
                    RatingComponents = new Dictionary<string, double>
                    {
                        ["Game 1"] = 0.4,
                        ["Game 2"] = 0.6
                    },
                    Details = new TeamDetails()
                },
                new RankedTeam
                {
                    Rank = 2,
                    TeamName = "Team B",
                    Rating = 80.0,
                    Conference = "SEC",
                    Division = "West",
                    Wins = 1,
                    Losses = 0,
                    StrengthOfSchedule = 0.6,
                    WeightedSOS = 0.65,
                    SOSRanking = 20,
                    RatingComponents = new Dictionary<string, double>
                    {
                        ["Game 1"] = 0.3
                    },
                    Details = new TeamDetails()
                }
            ]
        };

        var bytes = _module.GenerateRankingsWorkbook(rankings);

        using var package = new ExcelPackage(new MemoryStream(bytes));
        var worksheet = package.Workbook.Worksheets[0];

        Assert.Equal(0.3, worksheet.Cells[3, 12].Value);
        Assert.Null(worksheet.Cells[3, 13].Value);
    }

    [Fact]
    public void GenerateRankingsWorkbook_ThrowsOnNull()
    {
        Assert.Throws<ArgumentNullException>(() => _module.GenerateRankingsWorkbook(null!));
    }

    private static PredictionsResult CreatePredictionsResult()
    {
        return new PredictionsResult
        {
            Season = 2024,
            Week = 5,
            Predictions =
            [
                new GamePrediction
                {
                    ActualAwayScore = 21,
                    ActualHomeScore = 28,
                    ActualOverUnderResult = "Over",
                    ActualSpreadCoveringTeam = "Nebraska",
                    ActualWinner = "Nebraska",
                    AwayTeam = "Iowa",
                    AwayTeamScore = 21,
                    BettingOverUnder = 54.5,
                    BettingSpread = -3.5,
                    HomeTeam = "Nebraska",
                    HomeTeamScore = 28,
                    MyOverUnderPick = "Over",
                    MySpreadPick = "Nebraska",
                    NeutralSite = false,
                    OverUnderGrade = PredictionGradeStatus.Correct,
                    PredictedMargin = 7.5,
                    PredictedWinner = "Nebraska",
                    SpreadGrade = PredictionGradeStatus.Correct,
                    WinnerGrade = PredictionGradeStatus.Correct
                }
            ]
        };
    }

    private static RankingsResult CreateRankingsResult()
    {
        return new RankingsResult
        {
            Season = 2024,
            Week = 5,
            Rankings =
            [
                new RankedTeam
                {
                    Rank = 1,
                    TeamName = "Team A",
                    Rating = 90.1234,
                    Conference = "Big Ten",
                    Division = "East",
                    Wins = 5,
                    Losses = 1,
                    StrengthOfSchedule = 0.7,
                    WeightedSOS = 0.8,
                    SOSRanking = 3,
                    RatingComponents = new Dictionary<string, double>
                    {
                        ["BaseWins"] = 40,
                        ["MarginFactor"] = 5,
                        ["SOSBonus"] = 10
                    },
                    Details = new TeamDetails()
                }
            ]
        };
    }
}
