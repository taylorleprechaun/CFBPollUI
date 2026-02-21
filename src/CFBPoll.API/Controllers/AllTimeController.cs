using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/v1/all-time")]
public class AllTimeController : ControllerBase
{
    private readonly IAllTimeModule _allTimeModule;
    private readonly ILogger<AllTimeController> _logger;

    public AllTimeController(
        IAllTimeModule allTimeModule,
        ILogger<AllTimeController> logger)
    {
        _allTimeModule = allTimeModule ?? throw new ArgumentNullException(nameof(allTimeModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves all-time rankings including best teams, worst teams, and hardest schedules.
    /// </summary>
    /// <returns>All-time rankings across all seasons.</returns>
    [HttpGet]
    public async Task<ActionResult<AllTimeResponseDTO>> GetAllTimeRankings()
    {
        _logger.LogInformation("Fetching all-time rankings");

        var result = await _allTimeModule.GetAllTimeRankingsAsync();

        return Ok(AllTimeMapper.ToResponseDTO(result));
    }
}
