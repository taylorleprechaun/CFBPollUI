using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using OfficeOpenXml;

namespace CFBPoll.Core.Modules;

public class ExcelExportModule : IExcelExportModule
{
    /// <summary>
    /// Sorts dynamic column names such that embedded numbers order numerically (Game 2 before Game 10) 
    /// rather than lexicographically, while behaving like a plain alphabetical sort for columns with no digits.
    /// </summary>
    private static readonly IComparer<string> _naturalColumnComparer = Comparer<string>.Create(CompareColumnNamesNaturally);

    public ExcelExportModule()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public byte[] GeneratePredictionsWorkbook(PredictionsResult predictions)
    {
        ArgumentNullException.ThrowIfNull(predictions);

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Predictions");

        WritePredictionHeaders(worksheet);
        WritePredictionData(worksheet, predictions.Predictions);
        FormatPredictionsWorksheet(worksheet);

        return package.GetAsByteArray();
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

    private static int CompareColumnNamesNaturally(string? a, string? b)
    {
        a ??= string.Empty;
        b ??= string.Empty;

        var i = 0;
        var j = 0;
        while (i < a.Length && j < b.Length)
        {
            if (char.IsDigit(a[i]) && char.IsDigit(b[j]))
            {
                var startI = i;
                var startJ = j;
                while (i < a.Length && char.IsDigit(a[i])) i++;
                while (j < b.Length && char.IsDigit(b[j])) j++;

                var numberCompare = long.Parse(a[startI..i]).CompareTo(long.Parse(b[startJ..j]));
                if (numberCompare != 0)
                    return numberCompare;

                continue;
            }

            var charCompare = a[i].CompareTo(b[j]);
            if (charCompare != 0)
                return charCompare;

            i++;
            j++;
        }

        return (a.Length - i).CompareTo(b.Length - j);
    }

    private void FormatPredictionsWorksheet(ExcelWorksheet worksheet)
    {
        const int totalColumns = 17;

        // Predicted Margin column (E) - 2 decimals
        worksheet.Column(5).Style.Numberformat.Format = "0.00";
        // Betting Spread column (H) - 2 decimals
        worksheet.Column(8).Style.Numberformat.Format = "0.00";
        // Betting O/U column (K) - 2 decimals
        worksheet.Column(11).Style.Numberformat.Format = "0.00";

        worksheet.Cells[1, 1, 1, totalColumns].Style.Font.Bold = true;
        worksheet.Cells.AutoFitColumns();
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

        return columns.OrderBy(c => c, _naturalColumnComparer).ToList();
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
                //Leave the cell blank rather than defaulting to 0 when a team has no value for this component.
                if (team.RatingComponents.TryGetValue(dynamicColumns[j], out var componentValue))
                {
                    worksheet.Cells[row, 12 + j].Value = componentValue;
                }
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

    private void WritePredictionData(ExcelWorksheet worksheet, IReadOnlyList<GamePrediction> predictions)
    {
        for (var i = 0; i < predictions.Count; i++)
        {
            var prediction = predictions[i];
            var row = i + 2;

            worksheet.Cells[row, 1].Value = prediction.AwayTeam;
            worksheet.Cells[row, 2].Value = prediction.HomeTeam;
            worksheet.Cells[row, 3].Value = prediction.NeutralSite;
            worksheet.Cells[row, 4].Value = prediction.PredictedWinner;
            worksheet.Cells[row, 5].Value = prediction.PredictedMargin;
            worksheet.Cells[row, 6].Value = prediction.AwayTeamScore;
            worksheet.Cells[row, 7].Value = prediction.HomeTeamScore;

            if (prediction.BettingSpread.HasValue)
                worksheet.Cells[row, 8].Value = prediction.BettingSpread.Value;

            worksheet.Cells[row, 9].Value = prediction.MySpreadPick;
            worksheet.Cells[row, 10].Value = prediction.SpreadGrade.ToString();

            if (prediction.BettingOverUnder.HasValue)
                worksheet.Cells[row, 11].Value = prediction.BettingOverUnder.Value;

            worksheet.Cells[row, 12].Value = prediction.MyOverUnderPick;
            worksheet.Cells[row, 13].Value = prediction.OverUnderGrade.ToString();

            if (prediction.ActualAwayScore.HasValue)
                worksheet.Cells[row, 14].Value = prediction.ActualAwayScore.Value;

            if (prediction.ActualHomeScore.HasValue)
                worksheet.Cells[row, 15].Value = prediction.ActualHomeScore.Value;

            if (prediction.ActualWinner is not null)
                worksheet.Cells[row, 16].Value = prediction.ActualWinner;

            worksheet.Cells[row, 17].Value = prediction.WinnerGrade.ToString();
        }
    }

    private void WritePredictionHeaders(ExcelWorksheet worksheet)
    {
        worksheet.Cells[1, 1].Value = "Away Team";
        worksheet.Cells[1, 2].Value = "Home Team";
        worksheet.Cells[1, 3].Value = "Neutral Site";
        worksheet.Cells[1, 4].Value = "Predicted Winner";
        worksheet.Cells[1, 5].Value = "Predicted Margin";
        worksheet.Cells[1, 6].Value = "Predicted Away Score";
        worksheet.Cells[1, 7].Value = "Predicted Home Score";
        worksheet.Cells[1, 8].Value = "Betting Spread";
        worksheet.Cells[1, 9].Value = "My Spread Pick";
        worksheet.Cells[1, 10].Value = "Spread Grade";
        worksheet.Cells[1, 11].Value = "Betting O/U";
        worksheet.Cells[1, 12].Value = "My O/U Pick";
        worksheet.Cells[1, 13].Value = "O/U Grade";
        worksheet.Cells[1, 14].Value = "Actual Away Score";
        worksheet.Cells[1, 15].Value = "Actual Home Score";
        worksheet.Cells[1, 16].Value = "Actual Winner";
        worksheet.Cells[1, 17].Value = "Winner Grade";
    }
}
