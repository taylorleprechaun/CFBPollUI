using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CFBPoll.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamsController : ControllerBase
{
    private readonly ICFBDataService _dataService;
    private readonly ILogger<TeamsController> _logger;
    private readonly HistoricalDataOptions _options;
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingModule _ratingModule;

    public TeamsController(
        ICFBDataService dataService,
        IRankingsModule rankingsModule,
        IRatingModule ratingModule,
        IOptions<HistoricalDataOptions> options,
        ILogger<TeamsController> logger)
    {
        _dataService = dataService;
        _rankingsModule = rankingsModule;
        _ratingModule = ratingModule;
        _options = options.Value;
        _logger = logger;
    }

    [HttpGet("{teamName}")]
    public async Task<ActionResult<TeamDetailResponseDTO>> GetTeamDetail(
        string teamName,
        [FromQuery] int season,
        [FromQuery] int week)
    {
        _logger.LogInformation(
            "Fetching team detail for {TeamName}, season {Season}, week {Week}",
            teamName, season, week);

        if (season < _options.MinimumYear || season > DateTime.Now.Year + 1)
            return BadRequest(new { message = "Invalid season year" });

        if (week < 1)
            return BadRequest(new { message = "Invalid week number" });

        if (string.IsNullOrWhiteSpace(teamName))
            return BadRequest(new { message = "Team name is required" });

        var seasonData = await _dataService.GetSeasonDataAsync(season, week);

        if (!seasonData.Teams.ContainsKey(teamName))
            return NotFound(new { message = $"Team '{teamName}' not found" });

        var ratings = _ratingModule.RateTeams(seasonData);
        var rankingsResult = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var rankedTeam = rankingsResult.Rankings.FirstOrDefault(
            r => r.TeamName.Equals(teamName, StringComparison.OrdinalIgnoreCase));

        if (rankedTeam is null)
            return NotFound(new { message = $"Team '{teamName}' not found in rankings" });

        var fullSchedule = await _dataService.GetFullSeasonScheduleAsync(season);
        var teamInfo = seasonData.Teams[teamName];

        var response = TeamDetailMapper.ToResponseDTO(
            rankedTeam, teamInfo, fullSchedule, seasonData.Teams);

        return Ok(response);
    }
}
