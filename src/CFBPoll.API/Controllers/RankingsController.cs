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
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingModule _ratingModule;

    public RankingsController(
        ICFBDataService dataService,
        IRankingsModule rankingsModule,
        IRatingModule ratingModule,
        ILogger<RankingsController> logger)
    {
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _ratingModule = ratingModule ?? throw new ArgumentNullException(nameof(ratingModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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

        var persisted = await _rankingsModule.GetPublishedSnapshotAsync(season, week);
        if (persisted is not null)
        {
            _logger.LogDebug("Returning persisted rankings for season {Season}, week {Week}", season, week);
            return Ok(RankingsMapper.ToResponseDTO(persisted));
        }

        var seasonData = await _dataService.GetSeasonDataAsync(season, week);
        var ratings = _ratingModule.RateTeams(seasonData);
        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

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

        var calendar = await _dataService.GetCalendarAsync(season);
        var availableWeeks = await _rankingsModule.GetAvailableWeeksAsync(season, calendar);

        var weekDTOs = availableWeeks.Select(w => new WeekDTO
        {
            Label = w.Label,
            WeekNumber = w.WeekNumber
        });

        return Ok(new WeeksResponseDTO
        {
            Season = season,
            Weeks = weekDTOs
        });
    }
}
