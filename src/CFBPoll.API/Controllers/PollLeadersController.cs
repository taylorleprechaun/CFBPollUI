using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/v1/poll-leaders")]
public class PollLeadersController : ControllerBase
{
    private readonly ILogger<PollLeadersController> _logger;
    private readonly IPollLeadersModule _pollLeadersModule;

    public PollLeadersController(
        IPollLeadersModule pollLeadersModule,
        ILogger<PollLeadersController> logger)
    {
        _pollLeadersModule = pollLeadersModule ?? throw new ArgumentNullException(nameof(pollLeadersModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves poll leader statistics showing how frequently teams have been ranked.
    /// </summary>
    /// <param name="minSeason">Optional minimum season to include in the range.</param>
    /// <param name="maxSeason">Optional maximum season to include in the range.</param>
    /// <returns>Per-team ranking appearance counts for both all-weeks and final-weeks modes.</returns>
    [HttpGet]
    public async Task<ActionResult<PollLeadersResponseDTO>> GetPollLeaders(
        [FromQuery] int? minSeason,
        [FromQuery] int? maxSeason)
    {
        if (minSeason.HasValue && maxSeason.HasValue && minSeason.Value > maxSeason.Value)
        {
            return BadRequest(new ErrorResponseDTO
            {
                Message = "minSeason must be less than or equal to maxSeason",
                StatusCode = 400
            });
        }

        _logger.LogInformation("Fetching poll leaders for seasons {MinSeason} to {MaxSeason}",
            minSeason?.ToString() ?? "all", maxSeason?.ToString() ?? "all");

        var result = await _pollLeadersModule.GetPollLeadersAsync(minSeason, maxSeason);

        return Ok(PollLeadersMapper.ToResponseDTO(result));
    }
}
