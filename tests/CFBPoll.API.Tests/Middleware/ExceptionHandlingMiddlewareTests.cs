using Xunit;
using System.Net;
using System.Text.Json;
using CFBPoll.API.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;

namespace CFBPoll.API.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    private readonly Mock<ILogger<ExceptionHandlingMiddleware>> _mockLogger;

    public ExceptionHandlingMiddlewareTests()
    {
        _mockLogger = new Mock<ILogger<ExceptionHandlingMiddleware>>();
    }

    [Fact]
    public async Task InvokeAsync_NoException_CallsNext()
    {
        var context = new DefaultHttpContext();
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(next, _mockLogger.Object);

        await middleware.InvokeAsync(context);

        Assert.True(nextCalled);
    }

    [Fact]
    public async Task InvokeAsync_ArgumentException_Returns400()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        RequestDelegate next = _ => throw new ArgumentException("Invalid argument");
        var middleware = new ExceptionHandlingMiddleware(next, _mockLogger.Object);

        await middleware.InvokeAsync(context);

        Assert.Equal((int)HttpStatusCode.BadRequest, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_KeyNotFoundException_Returns404()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        RequestDelegate next = _ => throw new KeyNotFoundException("Not found");
        var middleware = new ExceptionHandlingMiddleware(next, _mockLogger.Object);

        await middleware.InvokeAsync(context);

        Assert.Equal((int)HttpStatusCode.NotFound, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_UnauthorizedAccessException_Returns401()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        RequestDelegate next = _ => throw new UnauthorizedAccessException("Unauthorized");
        var middleware = new ExceptionHandlingMiddleware(next, _mockLogger.Object);

        await middleware.InvokeAsync(context);

        Assert.Equal((int)HttpStatusCode.Unauthorized, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_GenericException_Returns500()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        RequestDelegate next = _ => throw new Exception("Something went wrong");
        var middleware = new ExceptionHandlingMiddleware(next, _mockLogger.Object);

        await middleware.InvokeAsync(context);

        Assert.Equal((int)HttpStatusCode.InternalServerError, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_Exception_ReturnsJsonResponse()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        context.TraceIdentifier = "test-trace-id";

        RequestDelegate next = _ => throw new ArgumentException("Test error");
        var middleware = new ExceptionHandlingMiddleware(next, _mockLogger.Object);

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        var response = JsonSerializer.Deserialize<JsonElement>(responseBody);
        Assert.Equal("test-trace-id", response.GetProperty("traceId").GetString());
        Assert.Equal("Test error", response.GetProperty("message").GetString());
        Assert.Equal(400, response.GetProperty("statusCode").GetInt32());
    }

    [Fact]
    public async Task InvokeAsync_InternalServerError_HidesExceptionMessage()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        RequestDelegate next = _ => throw new Exception("Sensitive internal error");
        var middleware = new ExceptionHandlingMiddleware(next, _mockLogger.Object);

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        var response = JsonSerializer.Deserialize<JsonElement>(responseBody);
        Assert.Equal("An unexpected error occurred", response.GetProperty("message").GetString());
    }
}
