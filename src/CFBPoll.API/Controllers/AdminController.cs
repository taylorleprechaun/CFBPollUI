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
    private const string PREDICTION_NOT_FOUND = "Prediction not found";
    private const string SNAPSHOT_NOT_FOUND = "Snapshot not found";

    private readonly IAdminModule _adminModule;
    private readonly ILogger<AdminController> _logger;
    private readonly IRankingsModule _rankingsModule;

    public AdminController(IAdminModule adminModule, ILogger<AdminController> logger, IRankingsModule rankingsModule)
    {
        _adminModule = adminModule ?? throw new ArgumentNullException(nameof(adminModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
    }

    /// <summary>
    /// Generates predictions for the specified season and week and saves as a draft.
    /// </summary>
    [HttpPost("seasons/{season}/weeks/{week}/prediction")]
    public async Task<ActionResult<CalculatePredictionsResponseDTO>> CalculatePredictions(int season, int week)
    {
        _logger.LogInformation("Admin calculating predictions for season {Season}, week {Week}",
            season, week);

        var result = await _adminModule.CalculatePredictionsAsync(season, week);

        return Ok(new CalculatePredictionsResponseDTO
        {
            IsPersisted = result.IsPersisted,
            Predictions = PredictionsMapper.ToResponseDTO(result.Predictions)
        });
    }

    /// <summary>
    /// Calculates rankings for the specified season and week and saves as a draft.
    /// </summary>
    [HttpPost("seasons/{season}/weeks/{week}/snapshot")]
    public async Task<ActionResult<CalculateResponseDTO>> Calculate(int season, int week)
    {
        _logger.LogInformation("Admin calculating rankings for season {Season}, week {Week}",
            season, week);

        var result = await _adminModule.CalculateRankingsAsync(season, week);
        var deltas = await _rankingsModule.GetRankDeltasAsync(season, week, result.Rankings.Rankings);

        return Ok(new CalculateResponseDTO
        {
            IsPersisted = result.IsPersisted,
            Rankings = RankingsMapper.ToResponseDTO(result.Rankings, deltas)
        });
    }

    /// <summary>
    /// Updates predictions for the specified season and week. Currently supports publishing.
    /// </summary>
    [HttpPatch("seasons/{season}/weeks/{week}/prediction")]
    public async Task<ActionResult> UpdatePrediction(int season, int week, [FromBody] UpdateSnapshotDTO request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!request.IsPublished)
            return BadRequest(new ErrorResponseDTO { Message = "Only publishing (isPublished: true) is currently supported", StatusCode = 400 });

        _logger.LogInformation("Admin publishing predictions for season {Season}, week {Week}", season, week);

        var published = await _adminModule.PublishPredictionsAsync(season, week);

        if (!published)
            return NotFound(new ErrorResponseDTO { Message = PREDICTION_NOT_FOUND, StatusCode = 404 });

        return Ok();
    }

    /// <summary>
    /// Updates a snapshot for the specified season and week. Currently supports publishing.
    /// </summary>
    [HttpPatch("seasons/{season}/weeks/{week}/snapshot")]
    public async Task<ActionResult> UpdateSnapshot(int season, int week, [FromBody] UpdateSnapshotDTO request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!request.IsPublished)
            return BadRequest(new ErrorResponseDTO { Message = "Only publishing (isPublished: true) is currently supported", StatusCode = 400 });

        _logger.LogInformation("Admin updating snapshot for season {Season}, week {Week}", season, week);

        var published = await _adminModule.PublishSnapshotAsync(season, week);

        if (!published)
            return NotFound(new ErrorResponseDTO { Message = SNAPSHOT_NOT_FOUND, StatusCode = 404 });

        return Ok();
    }

    /// <summary>
    /// Deletes predictions for the specified season and week.
    /// </summary>
    [HttpDelete("seasons/{season}/weeks/{week}/prediction")]
    public async Task<ActionResult> DeletePrediction(int season, int week)
    {
        _logger.LogInformation("Admin deleting predictions for season {Season}, week {Week}", season, week);

        var deleted = await _adminModule.DeletePredictionsAsync(season, week);

        if (!deleted)
            return NotFound(new ErrorResponseDTO { Message = PREDICTION_NOT_FOUND, StatusCode = 404 });

        return Ok();
    }

    /// <summary>
    /// Deletes a snapshot for the specified season and week.
    /// </summary>
    [HttpDelete("seasons/{season}/weeks/{week}/snapshot")]
    public async Task<ActionResult> Delete(int season, int week)
    {
        _logger.LogInformation("Admin deleting snapshot for season {Season}, week {Week}", season, week);

        var deleted = await _adminModule.DeleteSnapshotAsync(season, week);

        if (!deleted)
            return NotFound(new ErrorResponseDTO { Message = SNAPSHOT_NOT_FOUND, StatusCode = 404 });

        return Ok();
    }

    /// <summary>
    /// Gets all persisted prediction summaries including draft and published.
    /// </summary>
    [HttpGet("predictions")]
    public async Task<ActionResult<IEnumerable<PredictionsSummaryDTO>>> GetPredictions()
    {
        var summaries = await _adminModule.GetPredictionsSummariesAsync();

        return Ok(summaries.Select(PredictionsMapper.ToSummaryDTO));
    }

    /// <summary>
    /// Gets all persisted snapshots including draft and published.
    /// </summary>
    [HttpGet("snapshots")]
    public async Task<ActionResult<IEnumerable<SnapshotDTO>>> GetSnapshots()
    {
        var snapshots = await _adminModule.GetSnapshotsAsync();

        return Ok(snapshots.Select(SnapshotMapper.ToDTO));
    }

    /// <summary>
    /// Downloads an Excel export of the rankings for the specified season and week.
    /// </summary>
    [HttpGet("seasons/{season}/weeks/{week}/snapshot/export")]
    public async Task<ActionResult> Export(int season, int week)
    {
        _logger.LogInformation("Admin exporting rankings for season {Season}, week {Week}", season, week);

        var bytes = await _adminModule.ExportRankingsAsync(season, week);

        if (bytes is null)
            return NotFound(new ErrorResponseDTO { Message = SNAPSHOT_NOT_FOUND, StatusCode = 404 });

        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"Rankings_{season}_Week{week}.xlsx");
    }
}
