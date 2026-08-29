using CFBPoll.API.DTOs;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class AdminController : ControllerBase
{
    private const string CACHE_ENTRY_NOT_FOUND = "Cache entry not found";
    private const string PREDICTION_NOT_FOUND = "Prediction not found";
    private const string RANKING_NOT_FOUND = "Ranking not found";

    private readonly IAdminModule _adminModule;
    private readonly ILogger<AdminController> _logger;
    private readonly IRankingsModule _rankingsModule;

    public AdminController(IAdminModule adminModule, ILogger<AdminController> logger, IRankingsModule rankingsModule)
    {
        _adminModule = adminModule ?? throw new ArgumentNullException(nameof(adminModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
    }

    /// <summary>
    /// Calculates rankings for the specified season and week and saves as a draft.
    /// </summary>
    [HttpPost("seasons/{season}/weeks/{week}/ranking")]
    public async Task<ActionResult<CalculateResponseDTO>> Calculate(int season, int week)
    {
        _logger.LogInformation("Admin calculating rankings for season {Season}, week {Week}",
            season, week);

        var result = await _adminModule.CalculateRankingsAsync(season, week);
        var deltas = await _rankingsModule.GetRankDeltasAsync(season, week, result.Rankings.Rankings);

        return Ok(new CalculateResponseDTO
        {
            IsPersisted = result.IsPersisted,
            Rankings = RankingsMapper.ToResponseDTO(result.Rankings, deltas)
        });
    }

    /// <summary>
    /// Calculates rankings for the specified season and week using an explicitly chosen algorithm
    /// version, without persisting or publishing anything.
    /// </summary>
    [HttpPost("seasons/{season}/weeks/{week}/experimental/{algorithmVersion}")]
    public async Task<ActionResult<ExperimentalCalculateResponseDTO>> CalculateExperimental(int season, int week, RatingAlgorithmVersion algorithmVersion)
    {
        _logger.LogInformation(
            "Admin calculating experimental rankings for season {Season}, week {Week} using algorithm version {AlgorithmVersion}",
            season, week, algorithmVersion);

        var result = await _adminModule.CalculateExperimentalAsync(season, week, algorithmVersion);

        return Ok(new ExperimentalCalculateResponseDTO
        {
            AlgorithmVersion = result.AlgorithmVersion.ToString(),
            Rankings = RankingsMapper.ToResponseDTO(result.Rankings)
        });
    }

    /// <summary>
    /// Calculates predictions for the specified season and week using an explicitly chosen algorithm
    /// version and grades them against actual results, without persisting anything.
    /// </summary>
    [HttpPost("seasons/{season}/weeks/{week}/experimental/{algorithmVersion}/prediction")]
    public async Task<ActionResult<ExperimentalPredictionsResponseDTO>> CalculateExperimentalPredictions(int season, int week, RatingAlgorithmVersion algorithmVersion)
    {
        _logger.LogInformation(
            "Admin calculating experimental predictions for season {Season}, week {Week} using algorithm version {AlgorithmVersion}",
            season, week, algorithmVersion);

        var result = await _adminModule.CalculateExperimentalPredictionsAsync(season, week, algorithmVersion);

        return Ok(PredictionsMapper.ToExperimentalResponseDTO(result));
    }

    /// <summary>
    /// Calculates predictions for an explicit subset of weeks within a season using an explicitly
    /// chosen algorithm version, grades each week against actual results where available, and returns
    /// a season-overall summary plus a per-week breakdown, without persisting anything.
    /// </summary>
    [HttpPost("seasons/{season}/experimental/{algorithmVersion}/predictions")]
    public async Task<ActionResult<SeasonExperimentalPredictionsResponseDTO>> CalculateExperimentalSeasonPredictions(
        int season, RatingAlgorithmVersion algorithmVersion, [FromBody] CalculateExperimentalSeasonPredictionsRequestDTO request)
    {
        ArgumentNullException.ThrowIfNull(request);

        _logger.LogInformation(
            "Admin calculating experimental season predictions for season {Season} using algorithm version {AlgorithmVersion}",
            season, algorithmVersion);

        var result = await _adminModule.CalculateExperimentalSeasonPredictionsAsync(season, request.Weeks, algorithmVersion);

        return Ok(PredictionsMapper.ToSeasonExperimentalResponseDTO(result));
    }

    /// <summary>
    /// Computes season trends (top-25 rank progression) live across every week of a season using an
    /// explicitly chosen algorithm version, without reading or requiring persisted published rankings snapshots.
    /// </summary>
    [HttpPost("seasons/{season}/experimental/{algorithmVersion}/trends")]
    public async Task<ActionResult<SeasonTrendsResponseDTO>> CalculateExperimentalSeasonTrends(int season, RatingAlgorithmVersion algorithmVersion)
    {
        _logger.LogInformation(
            "Admin calculating experimental season trends for season {Season} using algorithm version {AlgorithmVersion}",
            season, algorithmVersion);

        var result = await _adminModule.CalculateExperimentalSeasonTrendsAsync(season, algorithmVersion);

        return Ok(SeasonTrendsMapper.ToResponseDTO(result));
    }

    /// <summary>
    /// Generates predictions for the specified season and week and saves as a draft.
    /// </summary>
    [HttpPost("seasons/{season}/weeks/{week}/prediction")]
    public async Task<ActionResult<CalculatePredictionsResponseDTO>> CalculatePredictions(int season, int week)
    {
        _logger.LogInformation("Admin calculating predictions for season {Season}, week {Week}",
            season, week);

        var result = await _adminModule.CalculatePredictionsAsync(season, week);

        return Ok(new CalculatePredictionsResponseDTO
        {
            IsPersisted = result.IsPersisted,
            Predictions = PredictionsMapper.ToResponseDTO(result.Predictions, resultsPublished: false, isGraded: false)
        });
    }

    /// <summary>
    /// Deletes a rankings snapshot for the specified season and week.
    /// </summary>
    [HttpDelete("seasons/{season}/weeks/{week}/ranking")]
    public async Task<ActionResult> Delete(int season, int week)
    {
        _logger.LogInformation("Admin deleting rankings snapshot for season {Season}, week {Week}", season, week);

        var deleted = await _adminModule.DeleteRankingsSnapshotAsync(season, week);

        if (!deleted)
            return NotFound(new ErrorResponseDTO { Message = RANKING_NOT_FOUND, StatusCode = 404 });

        return Ok();
    }

    /// <summary>
    /// Removes the persistent cache entries matching the given keys.
    /// </summary>
    [HttpDelete("cache")]
    public async Task<ActionResult<RemoveCacheEntriesResponseDTO>> DeleteCacheEntries([FromBody] IEnumerable<string> keys)
    {
        if (keys is null || !keys.Any())
            return BadRequest(new ErrorResponseDTO { Message = "At least one cache key is required", StatusCode = 400 });

        _logger.LogInformation("Admin removing cache entries by key list");

        var removedCount = await _adminModule.RemoveCacheEntriesAsync(keys);

        return Ok(new RemoveCacheEntriesResponseDTO { RemovedCount = removedCount });
    }

    /// <summary>
    /// Removes a single persistent cache entry by key.
    /// </summary>
    [HttpDelete("cache/{key}")]
    public async Task<ActionResult> DeleteCacheEntry(string key)
    {
        _logger.LogInformation("Admin removing cache entry {CacheKey}", key);

        var deleted = await _adminModule.RemoveCacheEntryAsync(key);

        if (!deleted)
            return NotFound(new ErrorResponseDTO { Message = CACHE_ENTRY_NOT_FOUND, StatusCode = 404 });

        return Ok();
    }

    /// <summary>
    /// Deletes predictions for the specified season and week.
    /// </summary>
    [HttpDelete("seasons/{season}/weeks/{week}/prediction")]
    public async Task<ActionResult> DeletePrediction(int season, int week)
    {
        _logger.LogInformation("Admin deleting predictions for season {Season}, week {Week}", season, week);

        var deleted = await _adminModule.DeletePredictionsAsync(season, week);

        if (!deleted)
            return NotFound(new ErrorResponseDTO { Message = PREDICTION_NOT_FOUND, StatusCode = 404 });

        return Ok();
    }

    /// <summary>
    /// Downloads an Excel export of the rankings for the specified season and week.
    /// </summary>
    [HttpGet("seasons/{season}/weeks/{week}/ranking/export")]
    public async Task<ActionResult> Export(int season, int week)
    {
        _logger.LogInformation("Admin exporting rankings for season {Season}, week {Week}", season, week);

        var bytes = await _adminModule.ExportRankingsAsync(season, week);

        if (bytes is null)
            return NotFound(new ErrorResponseDTO { Message = RANKING_NOT_FOUND, StatusCode = 404 });

        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"Rankings_{season}_Week{week + 1}.xlsx");
    }

    /// <summary>
    /// Downloads an Excel export of rankings for the specified season and week using an explicitly
    /// chosen algorithm version, without persisting or publishing anything.
    /// </summary>
    [HttpGet("seasons/{season}/weeks/{week}/experimental/{algorithmVersion}/export")]
    public async Task<ActionResult> ExportExperimental(int season, int week, RatingAlgorithmVersion algorithmVersion)
    {
        _logger.LogInformation(
            "Admin exporting experimental rankings for season {Season}, week {Week} using algorithm version {AlgorithmVersion}",
            season, week, algorithmVersion);

        var bytes = await _adminModule.ExportExperimentalAsync(season, week, algorithmVersion);

        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"Rankings_Experimental_{algorithmVersion}_{season}_Week{week + 1}.xlsx");
    }

    /// <summary>
    /// Retrieves every persistent cache entry, grouped into a display-friendly family/season/detail
    /// summary for the admin cache management page.
    /// </summary>
    [HttpGet("cache")]
    public async Task<ActionResult<IEnumerable<CacheEntryDTO>>> GetCacheEntries()
    {
        var entries = await _adminModule.GetCacheEntriesAsync();

        return Ok(entries.Select(CacheEntryMapper.ToDTO));
    }

    /// <summary>
    /// Retrieves the site's CollegeFootballData.com API account status (remaining/used calls, tier,
    /// reset date, request totals), cached server-side to avoid burning API quota on every page load.
    /// </summary>
    [HttpGet("cfbd-usage")]
    public async Task<ActionResult<CFBDUsageDTO>> GetCFBDUsage([FromQuery] bool forceRefresh = false)
    {
        var usage = await _adminModule.GetCFBDUsageAsync(forceRefresh);

        return Ok(CFBDUsageMapper.ToDTO(usage));
    }

    /// <summary>
    /// Retrieves the persisted predictions for the specified season and week without recalculating
    /// or re-grading. Returns full grade detail whenever the week has been graded, regardless of
    /// public publish state.
    /// </summary>
    [HttpGet("seasons/{season}/weeks/{week}/prediction")]
    public async Task<ActionResult<AdminPredictionsResponseDTO>> GetPrediction(int season, int week)
    {
        _logger.LogInformation("Admin fetching persisted predictions for season {Season}, week {Week}", season, week);

        var result = await _adminModule.GetPredictionsAsync(season, week);

        if (result is null)
            return NotFound(new ErrorResponseDTO { Message = PREDICTION_NOT_FOUND, StatusCode = 404 });

        return Ok(PredictionsMapper.ToAdminResponseDTO(result));
    }

    /// <summary>
    /// Gets all persisted prediction summaries including draft and published.
    /// </summary>
    [HttpGet("predictions")]
    public async Task<ActionResult<IEnumerable<PredictionsSummaryDTO>>> GetPredictions()
    {
        var summaries = await _adminModule.GetPredictionsSummariesAsync();

        return Ok(summaries.Select(PredictionsMapper.ToSummaryDTO));
    }

    /// <summary>
    /// Gets all persisted rankings snapshots including draft and published.
    /// </summary>
    [HttpGet("rankings")]
    public async Task<ActionResult<IEnumerable<RankingsSnapshotDTO>>> GetRankingsSnapshots()
    {
        var snapshots = await _adminModule.GetRankingsSnapshotsAsync();

        return Ok(snapshots.Select(RankingsSnapshotMapper.ToDTO));
    }

    /// <summary>
    /// Grades predictions for the specified season and week against actual final scores and saves
    /// the result as a draft.
    /// </summary>
    [HttpPost("seasons/{season}/weeks/{week}/prediction/grade")]
    public async Task<ActionResult<GradePredictionsResponseDTO>> GradePredictions(int season, int week)
    {
        _logger.LogInformation("Admin grading predictions for season {Season}, week {Week}", season, week);

        var result = await _adminModule.GradePredictionsAsync(season, week);

        if (result is null)
            return NotFound(new ErrorResponseDTO { Message = PREDICTION_NOT_FOUND, StatusCode = 404 });

        return Ok(PredictionsMapper.ToGradeResponseDTO(result));
    }

    /// <summary>
    /// Publishes graded results for the specified season and week, making them visible on the
    /// public predictions page. Only succeeds if the week has already been graded and the picks
    /// are published.
    /// </summary>
    [HttpPatch("seasons/{season}/weeks/{week}/prediction/results")]
    public async Task<ActionResult> PublishGradedResults(int season, int week, [FromBody] SetPublishedRequestDTO request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!request.IsPublished)
            return BadRequest(new ErrorResponseDTO { Message = "Only publishing (isPublished: true) is currently supported", StatusCode = 400 });

        _logger.LogInformation("Admin publishing graded results for season {Season}, week {Week}", season, week);

        var published = await _adminModule.PublishGradedResultsAsync(season, week);

        if (!published)
            return NotFound(new ErrorResponseDTO { Message = PREDICTION_NOT_FOUND, StatusCode = 404 });

        return Ok();
    }

    /// <summary>
    /// Clears cached CollegeFootballData API responses for the specified season and week without
    /// recalculating rankings or predictions. Use when CFBD has corrected source data and an admin
    /// wants fresh data available before deciding whether to recalculate.
    /// </summary>
    [HttpPost("seasons/{season}/weeks/{week}/cache")]
    public async Task<ActionResult<RefreshCacheResponseDTO>> RefreshCache(int season, int week)
    {
        _logger.LogInformation("Admin refreshing cached CFBD data for season {Season}, week {Week}", season, week);

        var removedCount = await _adminModule.RefreshSeasonCacheAsync(season, week);

        return Ok(new RefreshCacheResponseDTO { RemovedCount = removedCount, Season = season, Week = week });
    }

    /// <summary>
    /// Updates predictions for the specified season and week. Currently supports publishing.
    /// </summary>
    [HttpPatch("seasons/{season}/weeks/{week}/prediction")]
    public async Task<ActionResult> UpdatePrediction(int season, int week, [FromBody] SetPublishedRequestDTO request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!request.IsPublished)
            return BadRequest(new ErrorResponseDTO { Message = "Only publishing (isPublished: true) is currently supported", StatusCode = 400 });

        _logger.LogInformation("Admin publishing predictions for season {Season}, week {Week}", season, week);

        var published = await _adminModule.PublishPredictionsAsync(season, week);

        if (!published)
            return NotFound(new ErrorResponseDTO { Message = PREDICTION_NOT_FOUND, StatusCode = 404 });

        return Ok();
    }

    /// <summary>
    /// Updates a rankings snapshot for the specified season and week. Currently supports publishing.
    /// </summary>
    [HttpPatch("seasons/{season}/weeks/{week}/ranking")]
    public async Task<ActionResult> UpdateRankingsSnapshot(int season, int week, [FromBody] SetPublishedRequestDTO request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!request.IsPublished)
            return BadRequest(new ErrorResponseDTO { Message = "Only publishing (isPublished: true) is currently supported", StatusCode = 400 });

        _logger.LogInformation("Admin updating rankings snapshot for season {Season}, week {Week}", season, week);

        var published = await _adminModule.PublishRankingsSnapshotAsync(season, week);

        if (!published)
            return NotFound(new ErrorResponseDTO { Message = RANKING_NOT_FOUND, StatusCode = 404 });

        return Ok();
    }
}
