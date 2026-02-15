using CFBPoll.API.DTOs;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace CFBPoll.API.Filters;

/// <summary>
/// Validates that season and week query parameters are within acceptable ranges.
/// </summary>
[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
public class ValidateSeasonWeekAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        HistoricalDataOptions options = context.HttpContext.RequestServices
            .GetRequiredService<IOptions<HistoricalDataOptions>>().Value;

        if (context.ActionArguments.TryGetValue("season", out object? seasonObj) && seasonObj is int season)
        {
            if (season < options.MinimumYear || season > DateTime.UtcNow.Year + 1)
            {
                context.Result = new BadRequestObjectResult(new ErrorResponseDTO
                {
                    Message = "Invalid season year",
                    StatusCode = 400
                });
                return;
            }
        }

        if (context.ActionArguments.TryGetValue("week", out object? weekObj) && weekObj is int week)
        {
            if (week < 1)
            {
                context.Result = new BadRequestObjectResult(new ErrorResponseDTO
                {
                    Message = "Invalid week number",
                    StatusCode = 400
                });
                return;
            }
        }

        base.OnActionExecuting(context);
    }
}
