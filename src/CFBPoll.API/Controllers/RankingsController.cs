using CFBPoll.API.DTOs;
using CFBPoll.API.Filters;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[ApiController]
public class RankingsController : ControllerBase
{
    private readonly ICFBDataService _dataService;
    private readonly ILogger<RankingsController> _logger;
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingModule _ratingModule;

    public RankingsController(
        ICFBDataService dataService,
        IRankingsModule rankingsModule,
        IRatingModule ratingModule,
        ILogger<RankingsController> logger)
    {
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _ratingModule = ratingModule ?? throw new ArgumentNullException(nameof(ratingModule));
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

        var persisted = await _rankingsModule.GetPublishedSnapshotAsync(season, week);
        if (persisted is not null)
        {
            _logger.LogDebug("Returning persisted rankings for season {Season}, week {Week}", season, week);
            var deltas = await _rankingsModule.GetRankDeltasAsync(season, week, persisted.Rankings);
            return Ok(RankingsMapper.ToResponseDTO(persisted, deltas));
        }

        var seasonData = await _dataService.GetSeasonDataAsync(season, week);
        var ratings = await _ratingModule.RateTeamsAsync(seasonData);
        var result = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings);

        var liveDeltas = await _rankingsModule.GetRankDeltasAsync(season, week, result.Rankings);
        return Ok(RankingsMapper.ToResponseDTO(result, liveDeltas));
    }
}
