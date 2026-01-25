using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConferencesController : ControllerBase
{
    private readonly IConferenceModule _conferenceModule;
    private readonly ICFBDataService _dataService;
    private readonly ILogger<ConferencesController> _logger;

    public ConferencesController(
        IConferenceModule conferenceModule,
        ICFBDataService dataService,
        ILogger<ConferencesController> logger)
    {
        _conferenceModule = conferenceModule;
        _dataService = dataService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ConferencesResponseDTO>> GetConferences()
    {
        _logger.LogInformation("Fetching FBS conferences");

        var conferences = await _dataService.GetConferencesAsync();
        var conferenceInfos = _conferenceModule.GetConferenceInfos(conferences);

        return Ok(ConferenceMapper.ToResponseDTO(conferenceInfos));
    }
}
