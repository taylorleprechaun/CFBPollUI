using CFBPoll.API.DTOs;
using CFBPoll.API.Filters;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace CFBPoll.API.Tests.Filters;

public class ValidateSeasonWeekAttributeTests
{
    private readonly ValidateSeasonWeekAttribute _attribute;

    public ValidateSeasonWeekAttributeTests()
    {
        _attribute = new ValidateSeasonWeekAttribute();
    }

    [Theory]
    [InlineData(2001)]
    [InlineData(1999)]
    [InlineData(0)]
    public void OnActionExecuting_SeasonBelowMinimum_ReturnsBadRequest(int season)
    {
        ActionExecutingContext context = CreateContext(
            new Dictionary<string, object?> { { "season", season }, { "week", 1 } },
            minimumYear: 2002);

        _attribute.OnActionExecuting(context);

        var badRequest = Assert.IsType<BadRequestObjectResult>(context.Result);
        var error = Assert.IsType<ErrorResponseDTO>(badRequest.Value);
        Assert.Equal("Invalid season year", error.Message);
        Assert.Equal(400, error.StatusCode);
    }

    [Fact]
    public void OnActionExecuting_SeasonTooFarInFuture_ReturnsBadRequest()
    {
        int futureYear = DateTime.UtcNow.Year + 2;
        ActionExecutingContext context = CreateContext(
            new Dictionary<string, object?> { { "season", futureYear }, { "week", 1 } },
            minimumYear: 2002);

        _attribute.OnActionExecuting(context);

        var badRequest = Assert.IsType<BadRequestObjectResult>(context.Result);
        var error = Assert.IsType<ErrorResponseDTO>(badRequest.Value);
        Assert.Equal("Invalid season year", error.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public void OnActionExecuting_InvalidWeek_ReturnsBadRequest(int week)
    {
        ActionExecutingContext context = CreateContext(
            new Dictionary<string, object?> { { "season", 2023 }, { "week", week } },
            minimumYear: 2002);

        _attribute.OnActionExecuting(context);

        var badRequest = Assert.IsType<BadRequestObjectResult>(context.Result);
        var error = Assert.IsType<ErrorResponseDTO>(badRequest.Value);
        Assert.Equal("Invalid week number", error.Message);
        Assert.Equal(400, error.StatusCode);
    }

    [Fact]
    public void OnActionExecuting_ValidSeasonAndWeek_DoesNotSetResult()
    {
        ActionExecutingContext context = CreateContext(
            new Dictionary<string, object?> { { "season", 2023 }, { "week", 5 } },
            minimumYear: 2002);

        _attribute.OnActionExecuting(context);

        Assert.Null(context.Result);
    }

    [Fact]
    public void OnActionExecuting_SeasonAtMinimumYear_DoesNotSetResult()
    {
        ActionExecutingContext context = CreateContext(
            new Dictionary<string, object?> { { "season", 2002 }, { "week", 1 } },
            minimumYear: 2002);

        _attribute.OnActionExecuting(context);

        Assert.Null(context.Result);
    }

    [Fact]
    public void OnActionExecuting_SeasonAtNextYear_DoesNotSetResult()
    {
        int nextYear = DateTime.UtcNow.Year + 1;
        ActionExecutingContext context = CreateContext(
            new Dictionary<string, object?> { { "season", nextYear }, { "week", 1 } },
            minimumYear: 2002);

        _attribute.OnActionExecuting(context);

        Assert.Null(context.Result);
    }

    [Fact]
    public void OnActionExecuting_UsesMinimumYearFromOptions()
    {
        ActionExecutingContext context = CreateContext(
            new Dictionary<string, object?> { { "season", 2009 }, { "week", 1 } },
            minimumYear: 2010);

        _attribute.OnActionExecuting(context);

        Assert.IsType<BadRequestObjectResult>(context.Result);
    }

    [Fact]
    public void OnActionExecuting_NoSeasonArgument_DoesNotSetResult()
    {
        ActionExecutingContext context = CreateContext(
            new Dictionary<string, object?> { { "week", 5 } },
            minimumYear: 2002);

        _attribute.OnActionExecuting(context);

        Assert.Null(context.Result);
    }

    [Fact]
    public void OnActionExecuting_NoWeekArgument_DoesNotSetResult()
    {
        ActionExecutingContext context = CreateContext(
            new Dictionary<string, object?> { { "season", 2023 } },
            minimumYear: 2002);

        _attribute.OnActionExecuting(context);

        Assert.Null(context.Result);
    }

    private static ActionExecutingContext CreateContext(
        Dictionary<string, object?> actionArguments,
        int minimumYear)
    {
        var services = new ServiceCollection();
        services.Configure<HistoricalDataOptions>(opts => opts.MinimumYear = minimumYear);
        ServiceProvider serviceProvider = services.BuildServiceProvider();

        var httpContext = new DefaultHttpContext { RequestServices = serviceProvider };
        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());

        return new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            actionArguments,
            controller: null!);
    }
}
