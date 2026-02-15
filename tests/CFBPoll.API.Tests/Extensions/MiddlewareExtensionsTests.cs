using CFBPoll.API.Extensions;
using CFBPoll.API.Middleware;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace CFBPoll.API.Tests.Extensions;

public class MiddlewareExtensionsTests
{
    [Fact]
    public async Task UseRequestLogging_AddsMiddlewareToPipeline()
    {
        using var host = await new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder
                    .UseTestServer()
                    .ConfigureServices(services =>
                    {
                        services.AddLogging();
                    })
                    .Configure(app =>
                    {
                        app.UseRequestLogging();
                        app.Run(context =>
                        {
                            context.Response.StatusCode = 200;
                            return Task.CompletedTask;
                        });
                    });
            })
            .StartAsync();

        var client = host.GetTestClient();
        var response = await client.GetAsync("/test");

        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task UseExceptionHandling_AddsMiddlewareToPipeline()
    {
        using var host = await new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder
                    .UseTestServer()
                    .ConfigureServices(services =>
                    {
                        services.AddLogging();
                    })
                    .Configure(app =>
                    {
                        app.UseExceptionHandling();
                        app.Run(_ => throw new ArgumentException("Test error"));
                    });
            })
            .StartAsync();

        var client = host.GetTestClient();
        var response = await client.GetAsync("/test");

        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UseExceptionHandling_ReturnsJsonErrorResponse()
    {
        using var host = await new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder
                    .UseTestServer()
                    .ConfigureServices(services =>
                    {
                        services.AddLogging();
                    })
                    .Configure(app =>
                    {
                        app.UseExceptionHandling();
                        app.Run(_ => throw new KeyNotFoundException("Resource not found"));
                    });
            })
            .StartAsync();

        var client = host.GetTestClient();
        var response = await client.GetAsync("/test");
        var content = await response.Content.ReadAsStringAsync();

        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        Assert.Contains("The requested resource was not found", content);
    }

    [Fact]
    public void UseRequestLogging_ReturnsApplicationBuilder()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var serviceProvider = services.BuildServiceProvider();

        var appBuilder = new ApplicationBuilder(serviceProvider);

        var result = appBuilder.UseRequestLogging();

        Assert.NotNull(result);
        Assert.IsAssignableFrom<IApplicationBuilder>(result);
    }

    [Fact]
    public void UseExceptionHandling_ReturnsApplicationBuilder()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var serviceProvider = services.BuildServiceProvider();

        var appBuilder = new ApplicationBuilder(serviceProvider);

        var result = appBuilder.UseExceptionHandling();

        Assert.NotNull(result);
        Assert.IsAssignableFrom<IApplicationBuilder>(result);
    }

    [Fact]
    public async Task UseRequestLogging_PassesRequestToNextMiddleware()
    {
        var middlewareReached = false;

        using var host = await new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder
                    .UseTestServer()
                    .ConfigureServices(services =>
                    {
                        services.AddLogging();
                    })
                    .Configure(app =>
                    {
                        app.UseRequestLogging();
                        app.Run(_ =>
                        {
                            middlewareReached = true;
                            return Task.CompletedTask;
                        });
                    });
            })
            .StartAsync();

        var client = host.GetTestClient();
        await client.GetAsync("/test");

        Assert.True(middlewareReached);
    }

    [Fact]
    public async Task UseExceptionHandling_PassesRequestWhenNoException()
    {
        var middlewareReached = false;

        using var host = await new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder
                    .UseTestServer()
                    .ConfigureServices(services =>
                    {
                        services.AddLogging();
                    })
                    .Configure(app =>
                    {
                        app.UseExceptionHandling();
                        app.Run(_ =>
                        {
                            middlewareReached = true;
                            return Task.CompletedTask;
                        });
                    });
            })
            .StartAsync();

        var client = host.GetTestClient();
        await client.GetAsync("/test");

        Assert.True(middlewareReached);
    }

    [Fact]
    public async Task MiddlewarePipeline_WorksWithBothExtensions()
    {
        using var host = await new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder
                    .UseTestServer()
                    .ConfigureServices(services =>
                    {
                        services.AddLogging();
                    })
                    .Configure(app =>
                    {
                        app.UseExceptionHandling();
                        app.UseRequestLogging();
                        app.Run(context =>
                        {
                            context.Response.StatusCode = 200;
                            return context.Response.WriteAsync("Success");
                        });
                    });
            })
            .StartAsync();

        var client = host.GetTestClient();
        var response = await client.GetAsync("/test");
        var content = await response.Content.ReadAsStringAsync();

        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Success", content);
    }
}
