using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using OfficeOpenXml;

namespace CFBPoll.Core.Modules;

public class ExcelExportModule : IExcelExportModule
{
    public ExcelExportModule()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public byte[] GenerateRankingsWorkbook(RankingsResult rankings)
    {
        ArgumentNullException.ThrowIfNull(rankings);

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Rating Details");

        var rankedTeams = rankings.Rankings.ToList();
        var dynamicColumns = GetDynamicColumns(rankedTeams);

        WriteHeaders(worksheet, dynamicColumns);
        WriteData(worksheet, rankedTeams, dynamicColumns);
        FormatWorksheet(worksheet, rankedTeams.Count, dynamicColumns.Count);

        return package.GetAsByteArray();
    }

    private IReadOnlyList<string> GetDynamicColumns(IEnumerable<RankedTeam> teams)
    {
        var columns = new HashSet<string>();

        foreach (var team in teams)
        {
            foreach (var key in team.RatingComponents.Keys)
            {
                columns.Add(key);
            }
        }

        return columns.OrderBy(c => c).ToList();
    }

    private void FormatWorksheet(ExcelWorksheet worksheet, int dataRows, int dynamicColumnCount)
    {
        var totalColumns = 11 + dynamicColumnCount;

        // Number formatting
        var dataRange = dataRows > 0 ? dataRows + 1 : 1;

        // Rating column (C) - 4 decimals
        worksheet.Column(3).Style.Numberformat.Format = "0.0000";
        // Rating % column (D) - 4 decimal percentage
        worksheet.Column(4).Style.Numberformat.Format = "0.0000%";
        // Win % column (G) - 4 decimal percentage
        worksheet.Column(7).Style.Numberformat.Format = "0.0000%";
        // SOS column (H) - 4 decimals
        worksheet.Column(8).Style.Numberformat.Format = "0.0000";
        // Weighted SoS column (I) - 4 decimals
        worksheet.Column(9).Style.Numberformat.Format = "0.0000";

        // Dynamic component columns - 2 decimals
        for (var i = 0; i < dynamicColumnCount; i++)
        {
            worksheet.Column(12 + i).Style.Numberformat.Format = "0.00";
        }

        worksheet.Cells[1, 1, 1, totalColumns].Style.Font.Bold = true;
        worksheet.Cells.AutoFitColumns();
    }

    private void WriteData(ExcelWorksheet worksheet, IReadOnlyList<RankedTeam> teams, IReadOnlyList<string> dynamicColumns)
    {
        for (var i = 0; i < teams.Count; i++)
        {
            var team = teams[i];
            var row = i + 2;
            var totalGames = team.Wins + team.Losses;
            var maxRating = teams.Count > 0 ? teams[0].Rating : 1.0;

            worksheet.Cells[row, 1].Value = team.Rank;
            worksheet.Cells[row, 2].Value = team.TeamName;
            worksheet.Cells[row, 3].Value = team.Rating;
            worksheet.Cells[row, 4].Value = maxRating > 0 ? team.Rating / maxRating : 0;
            worksheet.Cells[row, 5].Value = team.Wins;
            worksheet.Cells[row, 6].Value = team.Losses;
            worksheet.Cells[row, 7].Value = totalGames > 0 ? (double)team.Wins / totalGames : 0;
            worksheet.Cells[row, 8].Value = team.StrengthOfSchedule;
            worksheet.Cells[row, 9].Value = team.WeightedSOS;
            worksheet.Cells[row, 10].Value = team.Conference;
            worksheet.Cells[row, 11].Value = team.Division;

            for (var j = 0; j < dynamicColumns.Count; j++)
            {
                var value = team.RatingComponents.TryGetValue(dynamicColumns[j], out var componentValue)
                    ? componentValue
                    : 0.0;
                worksheet.Cells[row, 12 + j].Value = value;
            }
        }
    }

    private void WriteHeaders(ExcelWorksheet worksheet, IReadOnlyList<string> dynamicColumns)
    {
        worksheet.Cells[1, 1].Value = "Ranking";
        worksheet.Cells[1, 2].Value = "Team Name";
        worksheet.Cells[1, 3].Value = "Rating";
        worksheet.Cells[1, 4].Value = "Rating %";
        worksheet.Cells[1, 5].Value = "Wins";
        worksheet.Cells[1, 6].Value = "Losses";
        worksheet.Cells[1, 7].Value = "Win %";
        worksheet.Cells[1, 8].Value = "SOS";
        worksheet.Cells[1, 9].Value = "Weighted SoS";
        worksheet.Cells[1, 10].Value = "Conference";
        worksheet.Cells[1, 11].Value = "Division";

        for (var i = 0; i < dynamicColumns.Count; i++)
        {
            worksheet.Cells[1, 12 + i].Value = dynamicColumns[i];
        }
    }
}
