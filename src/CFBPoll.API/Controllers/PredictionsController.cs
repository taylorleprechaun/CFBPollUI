using CFBPoll.API.DTOs;
using CFBPoll.API.Filters;
using CFBPoll.API.Mappers;
using CFBPoll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CFBPoll.API.Controllers;

[ApiController]
public class PredictionsController : ControllerBase
{
    private const string PREDICTIONS_NOT_FOUND = "Predictions not found";

    private readonly ILogger<PredictionsController> _logger;
    private readonly IPredictionsModule _predictionsModule;

    public PredictionsController(IPredictionsModule predictionsModule, ILogger<PredictionsController> logger)
    {
        _predictionsModule = predictionsModule ?? throw new ArgumentNullException(nameof(predictionsModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves published predictions for the specified season and week.
    /// </summary>
    /// <param name="season">The season year.</param>
    /// <param name="week">The week number within the season.</param>
    /// <returns>Published predictions if available; otherwise a 404 response.</returns>
    [HttpGet("api/v1/seasons/{season}/weeks/{week}/predictions")]
    [ValidateSeasonWeek]
    public async Task<ActionResult<PredictionsResponseDTO>> GetPredictions([FromRoute] int season, [FromRoute] int week)
    {
        _logger.LogInformation("Fetching published predictions for season {Season}, week {Week}", season, week);

        var published = await _predictionsModule.GetPublishedAsync(season, week);
        if (published is null)
            return NotFound(new ErrorResponseDTO { Message = PREDICTIONS_NOT_FOUND, StatusCode = 404 });

        return Ok(PredictionsMapper.ToResponseDTO(
            published.Value.Predictions,
            resultsPublished: published.Value.ResultsPublished,
            isGraded: published.Value.ResultsPublished));
    }
}
