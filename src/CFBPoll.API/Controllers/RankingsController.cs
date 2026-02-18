using CFBPoll.API.DTOs;
using CFBPoll.API.Filters;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class RankingsController : ControllerBase
{
    private readonly ICFBDataService _dataService;
    private readonly ILogger<RankingsController> _logger;
    private readonly IRankingsData _rankingsData;
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingModule _ratingModule;
    private readonly ISeasonModule _seasonModule;

    public RankingsController(
        ICFBDataService dataService,
        IRankingsData rankingsData,
        IRankingsModule rankingsModule,
        IRatingModule ratingModule,
        ISeasonModule seasonModule,
        ILogger<RankingsController> logger)
    {
        _dataService = dataService;
        _rankingsData = rankingsData;
        _rankingsModule = rankingsModule;
        _ratingModule = ratingModule;
        _seasonModule = seasonModule;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves team rankings for the specified season and week.
    /// </summary>
    /// <param name="season">The season year.</param>
    /// <param name="week">The week number within the season.</param>
    /// <returns>Rankings for all FBS teams.</returns>
    [HttpGet]
    [ValidateSeasonWeek]
    public async Task<ActionResult<RankingsResponseDTO>> GetRankings([FromQuery] int season, [FromQuery] int week)
    {
        _logger.LogInformation("Fetching rankings for season {Season}, week {Week}", season, week);

        var persisted = await _rankingsData.GetPublishedSnapshotAsync(season, week);
        if (persisted is not null)
        {
            _logger.LogDebug("Returning persisted rankings for season {Season}, week {Week}", season, week);
            return Ok(RankingsMapper.ToResponseDTO(persisted));
        }

        var seasonData = await _dataService.GetSeasonDataAsync(season, week);
        var ratings = _ratingModule.RateTeams(seasonData);
        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        await TryAutoPersistAsync(season, result);

        return Ok(RankingsMapper.ToResponseDTO(result));
    }

    /// <summary>
    /// Retrieves the published week numbers for the specified season.
    /// </summary>
    /// <param name="season">The season year.</param>
    /// <returns>Published weeks with labels for the specified season.</returns>
    [HttpGet("available-weeks")]
    public async Task<ActionResult<WeeksResponseDTO>> GetAvailableWeeks([FromQuery] int season)
    {
        _logger.LogInformation("Fetching available weeks for season {Season}", season);

        var publishedWeeks = await _rankingsData.GetPublishedWeekNumbersAsync(season);
        var publishedWeekSet = publishedWeeks.ToHashSet();

        var calendar = await _dataService.GetCalendarAsync(season);
        var weekLabels = _seasonModule.GetWeekLabels(calendar);

        var availableWeeks = weekLabels
            .Where(w => publishedWeekSet.Contains(w.WeekNumber))
            .Select(w => new WeekDTO
            {
                Label = w.Label,
                WeekNumber = w.WeekNumber
            });

        return Ok(new WeeksResponseDTO
        {
            Season = season,
            Weeks = availableWeeks
        });
    }

    private async Task TryAutoPersistAsync(int season, Core.Models.RankingsResult result)
    {
        try
        {
            var maxSeason = await _dataService.GetMaxSeasonYearAsync();
            if (season < maxSeason)
            {
                await _rankingsData.SaveSnapshotAsync(result);
                await _rankingsData.PublishSnapshotAsync(season, result.Week);
                _logger.LogInformation(
                    "Auto-persisted rankings for historical season {Season}, week {Week}",
                    season, result.Week);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to auto-persist rankings for season {Season}, week {Week}",
                season, result.Week);
        }
    }
}
