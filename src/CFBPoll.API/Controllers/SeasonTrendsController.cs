using CFBPoll.API.DTOs;
using CFBPoll.API.Filters;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/v1/seasons/{season}/trends")]
public class SeasonTrendsController : ControllerBase
{
    private readonly ILogger<SeasonTrendsController> _logger;
    private readonly ISeasonTrendsModule _seasonTrendsModule;

    public SeasonTrendsController(
        ISeasonTrendsModule seasonTrendsModule,
        ILogger<SeasonTrendsController> logger)
    {
        _seasonTrendsModule = seasonTrendsModule ?? throw new ArgumentNullException(nameof(seasonTrendsModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves season trends data showing how team rankings evolved across the specified season.
    /// </summary>
    /// <param name="season">The season year to retrieve trends for.</param>
    /// <returns>Season trends data with per-team rank progression.</returns>
    [HttpGet]
    [ValidateSeasonWeek]
    public async Task<ActionResult<SeasonTrendsResponseDTO>> GetSeasonTrends(int season)
    {
        _logger.LogInformation("Fetching season trends for season {Season}", season);

        var result = await _seasonTrendsModule.GetSeasonTrendsAsync(season);

        return Ok(SeasonTrendsMapper.ToResponseDTO(result));
    }
}
