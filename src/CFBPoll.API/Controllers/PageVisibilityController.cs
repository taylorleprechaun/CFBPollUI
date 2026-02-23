using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/v1/page-visibility")]
public class PageVisibilityController : ControllerBase
{
    private readonly ILogger<PageVisibilityController> _logger;
    private readonly IPageVisibilityModule _pageVisibilityModule;

    public PageVisibilityController(
        IPageVisibilityModule pageVisibilityModule,
        ILogger<PageVisibilityController> logger)
    {
        _pageVisibilityModule = pageVisibilityModule ?? throw new ArgumentNullException(nameof(pageVisibilityModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves the current page visibility settings.
    /// </summary>
    /// <returns>Current page visibility configuration.</returns>
    [HttpGet]
    public async Task<ActionResult<PageVisibilityDTO>> GetPageVisibility()
    {
        _logger.LogInformation("Fetching page visibility settings");

        var visibility = await _pageVisibilityModule.GetPageVisibilityAsync();

        return Ok(PageVisibilityMapper.ToDTO(visibility));
    }

    /// <summary>
    /// Updates page visibility settings.
    /// </summary>
    /// <param name="dto">The updated page visibility settings.</param>
    /// <returns>The updated page visibility configuration.</returns>
    [Authorize]
    [HttpPut]
    public async Task<ActionResult<PageVisibilityDTO>> UpdatePageVisibility([FromBody] PageVisibilityDTO? dto)
    {
        if (dto is null)
            return BadRequest(new ErrorResponseDTO { Message = "Request body is required", StatusCode = 400 });

        _logger.LogInformation(
            "Updating page visibility: AllTimeEnabled={AllTimeEnabled}, PollLeadersEnabled={PollLeadersEnabled}",
            dto.AllTimeEnabled, dto.PollLeadersEnabled);

        var model = PageVisibilityMapper.ToModel(dto);
        var success = await _pageVisibilityModule.UpdatePageVisibilityAsync(model);

        if (!success)
            return StatusCode(500, new ErrorResponseDTO { Message = "Failed to update page visibility", StatusCode = 500 });

        var updated = await _pageVisibilityModule.GetPageVisibilityAsync();

        return Ok(PageVisibilityMapper.ToDTO(updated));
    }
}
