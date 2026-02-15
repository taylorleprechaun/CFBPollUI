using System.Diagnostics;

namespace CFBPoll.API.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestPath = context.Request.Path;
        var method = context.Request.Method;
        var traceID = context.TraceIdentifier;

        _logger.LogInformation(
            "Request started: {Method} {Path} TraceId: {TraceId}",
            method,
            requestPath,
            traceID);

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var statusCode = context.Response.StatusCode;

            _logger.LogInformation(
                "Request completed: {Method} {Path} responded {StatusCode} in {ElapsedMs}ms TraceId: {TraceId}",
                method,
                requestPath,
                statusCode,
                stopwatch.ElapsedMilliseconds,
                traceID);
        }
    }
}
