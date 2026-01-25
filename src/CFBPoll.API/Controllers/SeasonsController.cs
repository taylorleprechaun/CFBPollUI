using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeasonsController : ControllerBase
{
    private readonly ICFBDataService _dataService;
    private readonly ILogger<SeasonsController> _logger;
    private readonly HistoricalDataOptions _options;
    private readonly ISeasonModule _seasonModule;

    public SeasonsController(
        ICFBDataService dataService,
        ISeasonModule seasonModule,
        IOptions<HistoricalDataOptions> options,
        ILogger<SeasonsController> logger)
    {
        _dataService = dataService;
        _seasonModule = seasonModule;
        _options = options.Value;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<SeasonsResponseDTO>> GetSeasons()
    {
        _logger.LogInformation("Fetching available seasons");

        var maxYear = await _dataService.GetMaxSeasonYearAsync();
        var seasons = _seasonModule.GetSeasonRange(_options.MinimumYear, maxYear);

        return Ok(new SeasonsResponseDTO { Seasons = seasons });
    }

    [HttpGet("{season}/weeks")]
    public async Task<ActionResult<WeeksResponseDTO>> GetWeeks(int season)
    {
        _logger.LogInformation("Fetching weeks for season {Season}", season);

        var calendar = await _dataService.GetCalendarAsync(season);
        var calendarList = calendar.ToList();

        if (calendarList.Count == 0)
            return NotFound(new { message = $"No calendar data found for season {season}" });

        var weeks = _seasonModule.GetWeekLabels(calendarList);

        return Ok(WeekMapper.ToResponseDTO(season, weeks));
    }
}
