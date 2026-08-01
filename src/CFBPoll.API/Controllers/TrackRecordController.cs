using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/v1/track-record")]
public class TrackRecordController : ControllerBase
{
    private readonly ILogger<TrackRecordController> _logger;
    private readonly ITrackRecordModule _trackRecordModule;

    public TrackRecordController(ITrackRecordModule trackRecordModule, ILogger<TrackRecordController> logger)
    {
        _trackRecordModule = trackRecordModule ?? throw new ArgumentNullException(nameof(trackRecordModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves the all-time prediction track record, showing right/wrong/push counts per pick
    /// category overall and broken down by graded week.
    /// </summary>
    /// <returns>Overall and per-week prediction track record totals.</returns>
    [HttpGet]
    public async Task<ActionResult<TrackRecordResponseDTO>> GetTrackRecord()
    {
        _logger.LogInformation("Fetching track record");

        var result = await _trackRecordModule.GetTrackRecordAsync();

        return Ok(TrackRecordMapper.ToResponseDTO(result));
    }
}
