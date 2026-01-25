using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RankingsController : ControllerBase
{
    private readonly ICFBDataService _dataService;
    private readonly ILogger<RankingsController> _logger;
    private readonly HistoricalDataOptions _options;
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingModule _ratingModule;

    public RankingsController(
        ICFBDataService dataService,
        IRankingsModule rankingsModule,
        IRatingModule ratingModule,
        IOptions<HistoricalDataOptions> options,
        ILogger<RankingsController> logger)
    {
        _dataService = dataService;
        _rankingsModule = rankingsModule;
        _ratingModule = ratingModule;
        _options = options.Value;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<RankingsResponseDTO>> GetRankings([FromQuery] int season, [FromQuery] int week)
    {
        _logger.LogInformation("Fetching rankings for season {Season}, week {Week}", season, week);

        if (season < _options.MinimumYear || season > DateTime.Now.Year + 1)
            return BadRequest(new { message = "Invalid season year" });

        if (week < 1)
            return BadRequest(new { message = "Invalid week number" });

        var seasonData = await _dataService.GetSeasonDataAsync(season, week);
        var ratings = _ratingModule.RateTeams(seasonData);
        var result = _rankingsModule.GenerateRankings(seasonData, ratings);

        return Ok(RankingsMapper.ToResponseDTO(result));
    }
}
