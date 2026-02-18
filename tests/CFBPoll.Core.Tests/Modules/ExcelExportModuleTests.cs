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
    public void GenerateRankingsWorkbook_ReturnsNonEmptyBytes()
    {
        var rankings = CreateRankingsResult();

        var result = _module.GenerateRankingsWorkbook(rankings);

        Assert.NotNull(result);
        Assert.True(result.Length > 0);
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
    public void GenerateRankingsWorkbook_ThrowsOnNull()
    {
        Assert.Throws<ArgumentNullException>(() => _module.GenerateRankingsWorkbook(null!));
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
