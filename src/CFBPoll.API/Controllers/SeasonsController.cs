using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class SeasonsController : ControllerBase
{
    private readonly ICFBDataService _dataService;
    private readonly ILogger<SeasonsController> _logger;
    private readonly HistoricalDataOptions _options;
    private readonly IRankingsModule _rankingsModule;
    private readonly ISeasonModule _seasonModule;

    public SeasonsController(
        ICFBDataService dataService,
        IRankingsModule rankingsModule,
        ISeasonModule seasonModule,
        IOptions<HistoricalDataOptions> options,
        ILogger<SeasonsController> logger)
    {
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _seasonModule = seasonModule ?? throw new ArgumentNullException(nameof(seasonModule));
        _options = (options ?? throw new ArgumentNullException(nameof(options))).Value;
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves the list of available seasons.
    /// </summary>
    /// <returns>An array of season years in descending order.</returns>
    [HttpGet]
    public async Task<ActionResult<SeasonsResponseDTO>> GetSeasons()
    {
        _logger.LogInformation("Fetching available seasons");

        var maxYear = await _dataService.GetMaxSeasonYearAsync();
        var seasons = _seasonModule.GetSeasonRange(_options.MinimumYear, maxYear);

        return Ok(new SeasonsResponseDTO { Seasons = seasons });
    }

    /// <summary>
    /// Retrieves the available weeks for a given season, including rankings publication status.
    /// </summary>
    /// <param name="season">The season year.</param>
    /// <returns>A list of weeks with labels and rankings publication status for the specified season.</returns>
    [HttpGet("{season}/weeks")]
    public async Task<ActionResult<WeeksResponseDTO>> GetWeeks(int season)
    {
        _logger.LogInformation("Fetching weeks for season {Season}", season);

        var calendarTask = _dataService.GetCalendarAsync(season);
        var publishedWeekNumbersTask = _rankingsModule.GetPublishedWeekNumbersAsync(season);

        await Task.WhenAll(calendarTask, publishedWeekNumbersTask);

        var calendar = await calendarTask;
        var publishedWeekNumbers = await publishedWeekNumbersTask;

        var calendarList = calendar.ToList();

        if (calendarList.Count == 0)
            return NotFound(new ErrorResponseDTO { Message = $"No calendar data found for season {season}", StatusCode = 404 });

        var weeks = _seasonModule.GetWeekLabels(calendarList);
        IReadOnlySet<int> publishedSet = publishedWeekNumbers.ToHashSet();

        return Ok(WeekMapper.ToResponseDTO(season, weeks, publishedSet));
    }
}
