using CFBPoll.API.DTOs;
using CFBPoll.API.Filters;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class TeamsController : ControllerBase
{
    private readonly ILogger<TeamsController> _logger;
    private readonly ITeamsModule _teamsModule;

    public TeamsController(ITeamsModule teamsModule, ILogger<TeamsController> logger)
    {
        _teamsModule = teamsModule ?? throw new ArgumentNullException(nameof(teamsModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves detailed information for a specific team including schedule and record breakdowns.
    /// </summary>
    /// <param name="teamName">The name of the team.</param>
    /// <param name="season">The season year.</param>
    /// <param name="week">The week number within the season.</param>
    /// <returns>Detailed team information including rank, rating, schedule, and record breakdowns.</returns>
    [HttpGet("{teamName}")]
    [ValidateSeasonWeek]
    public async Task<ActionResult<TeamDetailResponseDTO>> GetTeamDetail(
        string teamName,
        [FromQuery] int season,
        [FromQuery] int week)
    {
        _logger.LogInformation(
            "Fetching team detail for {TeamName}, season {Season}, week {Week}",
            teamName, season, week);

        if (string.IsNullOrWhiteSpace(teamName))
            return BadRequest(new ErrorResponseDTO { Message = "Team name is required", StatusCode = 400 });

        var result = await _teamsModule.GetTeamDetailAsync(teamName, season, week);

        if (result is null)
            return NotFound(new ErrorResponseDTO { Message = $"Team '{teamName}' not found", StatusCode = 404 });

        if (!result.Teams.TryGetValue(teamName, out var teamInfo))
            return NotFound(new ErrorResponseDTO { Message = $"Team '{teamName}' not found", StatusCode = 404 });

        var response = TeamDetailMapper.ToResponseDTO(
            result.RankedTeam, teamInfo, result.FullSchedule, result.Teams, result.AllRankings);

        return Ok(response);
    }
}
