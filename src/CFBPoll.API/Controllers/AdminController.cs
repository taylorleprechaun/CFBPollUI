using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IAdminModule _adminModule;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IAdminModule adminModule, ILogger<AdminController> logger)
    {
        _adminModule = adminModule;
        _logger = logger;
    }

    /// <summary>
    /// Calculates rankings for the specified season and week and saves as a draft.
    /// </summary>
    [HttpPost("calculate")]
    public async Task<ActionResult<CalculateResponseDTO>> Calculate([FromBody] CalculateRequestDTO request)
    {
        _logger.LogInformation("Admin calculating rankings for season {Season}, week {Week}",
            request.Season, request.Week);

        var result = await _adminModule.CalculateRankingsAsync(request.Season, request.Week);

        return Ok(new CalculateResponseDTO
        {
            Persisted = result.Persisted,
            Rankings = RankingsMapper.ToResponseDTO(result.Rankings)
        });
    }

    /// <summary>
    /// Publishes a draft snapshot for public visibility.
    /// </summary>
    [HttpPost("snapshots/{season}/{week}/publish")]
    public async Task<ActionResult> Publish(int season, int week)
    {
        _logger.LogInformation("Admin publishing snapshot for season {Season}, week {Week}", season, week);

        var published = await _adminModule.PublishSnapshotAsync(season, week);

        if (!published)
            return NotFound(new ErrorResponseDTO { Message = "Snapshot not found", StatusCode = 404 });

        return Ok();
    }

    /// <summary>
    /// Deletes a snapshot for the specified season and week.
    /// </summary>
    [HttpDelete("snapshots/{season}/{week}")]
    public async Task<ActionResult> Delete(int season, int week)
    {
        _logger.LogInformation("Admin deleting snapshot for season {Season}, week {Week}", season, week);

        var deleted = await _adminModule.DeleteSnapshotAsync(season, week);

        if (!deleted)
            return NotFound(new ErrorResponseDTO { Message = "Snapshot not found", StatusCode = 404 });

        return Ok();
    }

    /// <summary>
    /// Gets all persisted week summaries including draft and published.
    /// </summary>
    [HttpGet("persisted-weeks")]
    public async Task<ActionResult<IEnumerable<PersistedWeekDTO>>> GetPersistedWeeks()
    {
        var weeks = await _adminModule.GetPersistedWeeksAsync();

        var dtos = weeks.Select(w => new PersistedWeekDTO
        {
            CreatedAt = w.CreatedAt,
            Published = w.Published,
            Season = w.Season,
            Week = w.Week
        });

        return Ok(dtos);
    }

    /// <summary>
    /// Downloads an Excel export of the rankings for the specified season and week.
    /// </summary>
    [HttpGet("export")]
    public async Task<ActionResult> Export([FromQuery] int season, [FromQuery] int week)
    {
        _logger.LogInformation("Admin exporting rankings for season {Season}, week {Week}", season, week);

        var bytes = await _adminModule.ExportRankingsAsync(season, week);

        if (bytes is null)
            return NotFound(new ErrorResponseDTO { Message = "Snapshot not found", StatusCode = 404 });

        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"Rankings_{season}_Week{week}.xlsx");
    }
}
