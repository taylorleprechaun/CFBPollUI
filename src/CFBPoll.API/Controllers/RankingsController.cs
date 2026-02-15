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
        _dataService = dataService;
        _rankingsModule = rankingsModule;
        _ratingModule = ratingModule;
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

        var seasonData = await _dataService.GetSeasonDataAsync(season, week);
        var ratings = _ratingModule.RateTeams(seasonData);
        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        return Ok(RankingsMapper.ToResponseDTO(result));
    }
}
