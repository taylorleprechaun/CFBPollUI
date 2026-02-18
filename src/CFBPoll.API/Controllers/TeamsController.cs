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
    private readonly ICFBDataService _dataService;
    private readonly ILogger<TeamsController> _logger;
    private readonly IRankingsData _rankingsData;
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingModule _ratingModule;

    public TeamsController(
        ICFBDataService dataService,
        IRankingsData rankingsData,
        IRankingsModule rankingsModule,
        IRatingModule ratingModule,
        ILogger<TeamsController> logger)
    {
        _dataService = dataService;
        _rankingsData = rankingsData;
        _rankingsModule = rankingsModule;
        _ratingModule = ratingModule;
        _logger = logger;
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

        var seasonData = await _dataService.GetSeasonDataAsync(season, week);

        if (!seasonData.Teams.ContainsKey(teamName))
            return NotFound(new ErrorResponseDTO { Message = $"Team '{teamName}' not found", StatusCode = 404 });

        var rankingsResult = await _rankingsData.GetPublishedSnapshotAsync(season, week);

        if (rankingsResult is null)
        {
            var ratings = _ratingModule.RateTeams(seasonData);
            rankingsResult = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);
        }

        var rankedTeam = rankingsResult.Rankings.FirstOrDefault(
            r => r.TeamName.Equals(teamName, StringComparison.OrdinalIgnoreCase));

        if (rankedTeam is null)
            return NotFound(new ErrorResponseDTO { Message = $"Team '{teamName}' not found in rankings", StatusCode = 404 });

        var fullSchedule = await _dataService.GetFullSeasonScheduleAsync(season);
        var teamInfo = seasonData.Teams[teamName];

        var response = TeamDetailMapper.ToResponseDTO(
            rankedTeam, teamInfo, fullSchedule, seasonData.Teams, rankingsResult.Rankings);

        return Ok(response);
    }
}
