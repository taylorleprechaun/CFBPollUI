using CFBPoll.API.DTOs;
using CFBPoll.API.Filters;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[ApiController]
public class RankingsController : ControllerBase
{
    private readonly ICFBDataService _dataService;
    private readonly IGameOverrideModule _gameOverrideModule;
    private readonly ILogger<RankingsController> _logger;
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingAlgorithmResolver _ratingAlgorithmResolver;

    public RankingsController(
        ICFBDataService dataService,
        IGameOverrideModule gameOverrideModule,
        IRankingsModule rankingsModule,
        IRatingAlgorithmResolver ratingAlgorithmResolver,
        ILogger<RankingsController> logger)
    {
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _gameOverrideModule = gameOverrideModule ?? throw new ArgumentNullException(nameof(gameOverrideModule));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _ratingAlgorithmResolver = ratingAlgorithmResolver ?? throw new ArgumentNullException(nameof(ratingAlgorithmResolver));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves team rankings for the specified season and week.
    /// </summary>
    /// <param name="season">The season year.</param>
    /// <param name="week">The week number within the season.</param>
    /// <returns>Rankings for all FBS teams.</returns>
    [HttpGet("api/v1/seasons/{season}/weeks/{week}/rankings")]
    [ValidateSeasonWeek]
    public async Task<ActionResult<RankingsResponseDTO>> GetRankings([FromRoute] int season, [FromRoute] int week)
    {
        _logger.LogInformation("Fetching rankings for season {Season}, week {Week}", season, week);

        var persisted = await _rankingsModule.GetPublishedRankingsSnapshotAsync(season, week);
        if (persisted is not null)
        {
            _logger.LogDebug("Returning persisted rankings for season {Season}, week {Week}", season, week);
            var deltas = await _rankingsModule.GetRankDeltasAsync(season, week, persisted.Rankings);
            var response = RankingsMapper.ToResponseDTO(persisted, deltas);
            response.ScoreOverrides = await GetScoreOverrideDisclosuresAsync(
                season, gameOverride => persisted.PublishedAt.HasValue && gameOverride.CreatedAt <= persisted.PublishedAt.Value);
            return Ok(response);
        }

        var seasonData = await _dataService.GetSeasonDataAsync(season, week);
        var ratings = await _ratingAlgorithmResolver.ResolveForSeason(season).RateTeamsAsync(seasonData);
        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var liveDeltas = await _rankingsModule.GetRankDeltasAsync(season, week, result.Rankings);
        var liveResponse = RankingsMapper.ToResponseDTO(result, liveDeltas);
        liveResponse.ScoreOverrides = await GetScoreOverrideDisclosuresAsync(season, _ => true);
        return Ok(liveResponse);
    }

    private async Task<IEnumerable<ScoreOverrideDisclosureDTO>> GetScoreOverrideDisclosuresAsync(
        int season, Func<GameOverride, bool> isApplicable)
    {
        var overrides = (await _gameOverrideModule.GetGameOverridesBySeasonAsync(season)).Where(isApplicable).ToList();
        if (overrides.Count == 0)
            return [];

        var teamLogosByName = await TeamLogoLookup.GetTeamLogosByNameAsync(_dataService, season);

        return overrides.Select(o => GameOverrideMapper.ToDisclosureDTO(TeamLogoLookup.WithTeamLogos(o, teamLogosByName)));
    }
}
