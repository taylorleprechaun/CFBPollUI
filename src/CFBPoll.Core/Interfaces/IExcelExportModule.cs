using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for generating Excel workbooks from rankings data.
/// </summary>
public interface IExcelExportModule
{
    /// <summary>
    /// Generates an Excel workbook containing ranking details.
    /// </summary>
    /// <param name="rankings">The rankings result to export.</param>
    /// <returns>The Excel file as a byte array.</returns>
    byte[] GenerateRankingsWorkbook(RankingsResult rankings);
}
