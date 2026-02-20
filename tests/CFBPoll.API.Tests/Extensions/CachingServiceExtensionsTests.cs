using CFBPoll.API.Extensions;
using CFBPoll.Core.Caching;
using CFBPoll.Core.Data;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Modules;
using CFBPoll.Core.Options;
using CFBPoll.Core.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Extensions;

public class CachingServiceExtensionsTests
{
    [Fact]
    public void AddCFBDataServiceWithCaching_RegistersIPersistentCache()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration(apiKey: "test-api-key");

        services.AddCFBDataServiceWithCaching(configuration);

        var provider = services.BuildServiceProvider();
        var cache = provider.GetService<IPersistentCache>();

        Assert.NotNull(cache);
        Assert.IsType<CacheModule>(cache);
    }

    [Fact]
    public void AddCFBDataServiceWithCaching_RegistersICacheData()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration(apiKey: "test-api-key");

        services.AddCFBDataServiceWithCaching(configuration);

        var provider = services.BuildServiceProvider();
        var cacheData = provider.GetService<ICacheData>();

        Assert.NotNull(cacheData);
        Assert.IsType<CacheData>(cacheData);
    }

    [Fact]
    public void AddCFBDataServiceWithCaching_RegistersCFBDataService()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration(apiKey: "test-api-key");

        services.AddCFBDataServiceWithCaching(configuration);

        var provider = services.BuildServiceProvider();
        var service = provider.GetService<CFBDataService>();

        Assert.NotNull(service);
    }

    [Fact]
    public void AddCFBDataServiceWithCaching_RegistersICFBDataServiceAsCachingService()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration(apiKey: "test-api-key");

        services.AddCFBDataServiceWithCaching(configuration);

        var provider = services.BuildServiceProvider();
        var service = provider.GetService<ICFBDataService>();

        Assert.NotNull(service);
        Assert.IsType<CachingCFBDataService>(service);
    }

    [Fact]
    public void AddCFBDataServiceWithCaching_ConfiguresCacheOptions()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration(
            apiKey: "test-api-key",
            calendarExpirationHours: 48,
            maxSeasonYearExpirationHours: 12,
            seasonDataExpirationHours: 6);

        services.AddCFBDataServiceWithCaching(configuration);

        var provider = services.BuildServiceProvider();
        var options = provider.GetService<IOptions<CacheOptions>>();

        Assert.NotNull(options);
        Assert.Equal(48, options.Value.CalendarExpirationHours);
        Assert.Equal(12, options.Value.MaxSeasonYearExpirationHours);
        Assert.Equal(6, options.Value.SeasonDataExpirationHours);
    }

    [Fact]
    public void AddCFBDataServiceWithCaching_ConfiguresCacheConnectionString()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration(
            apiKey: "test-api-key",
            connectionString: "Data Source=test/cache.db");

        services.AddCFBDataServiceWithCaching(configuration);

        var provider = services.BuildServiceProvider();
        var options = provider.GetService<IOptions<CacheOptions>>();

        Assert.NotNull(options);
        Assert.Equal("Data Source=test/cache.db", options.Value.ConnectionString);
    }

    [Fact]
    public void AddCFBDataServiceWithCaching_ThrowsWhenApiKeyMissing()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration(apiKey: null);

        var exception = Assert.Throws<InvalidOperationException>(() =>
            services.AddCFBDataServiceWithCaching(configuration));

        Assert.Contains("API key not configured", exception.Message);
    }

    [Fact]
    public void AddCFBDataServiceWithCaching_UsesDefaultMinimumYear()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration(apiKey: "test-api-key", minimumYear: null);

        services.AddCFBDataServiceWithCaching(configuration);

        var provider = services.BuildServiceProvider();
        var service = provider.GetService<CFBDataService>();

        Assert.NotNull(service);
    }

    [Fact]
    public void AddCFBDataServiceWithCaching_UsesConfiguredMinimumYear()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration(apiKey: "test-api-key", minimumYear: 2010);

        services.AddCFBDataServiceWithCaching(configuration);

        var provider = services.BuildServiceProvider();
        var service = provider.GetService<CFBDataService>();

        Assert.NotNull(service);
    }

    [Fact]
    public void AddCFBDataServiceWithCaching_ReturnsServiceCollection()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration(apiKey: "test-api-key");

        var result = services.AddCFBDataServiceWithCaching(configuration);

        Assert.Same(services, result);
    }

    [Fact]
    public void AddCFBDataServiceWithCaching_RegistersServicesAsSingletons()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration(apiKey: "test-api-key");

        services.AddCFBDataServiceWithCaching(configuration);

        var provider = services.BuildServiceProvider();

        var service1 = provider.GetService<ICFBDataService>();
        var service2 = provider.GetService<ICFBDataService>();

        Assert.Same(service1, service2);
    }

    [Fact]
    public void AddCFBDataServiceWithCaching_CachingServiceWrapsInnerService()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration(apiKey: "test-api-key");

        services.AddCFBDataServiceWithCaching(configuration);

        var provider = services.BuildServiceProvider();

        var cachingService = provider.GetService<ICFBDataService>();
        var innerService = provider.GetService<CFBDataService>();

        Assert.NotNull(cachingService);
        Assert.NotNull(innerService);
        Assert.IsType<CachingCFBDataService>(cachingService);
        Assert.IsType<CFBDataService>(innerService);
    }

    [Fact]
    public async Task InitializeCacheAsync_CallsInitialize()
    {
        var mockCacheData = new Mock<ICacheData>();
        mockCacheData.Setup(x => x.InitializeAsync()).Returns(Task.CompletedTask);

        var services = new ServiceCollection();
        services.AddSingleton(mockCacheData.Object);

        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSingleton(mockCacheData.Object);
        var app = builder.Build();

        await app.InitializeCacheAsync();

        mockCacheData.Verify(x => x.InitializeAsync(), Times.Once);
    }

    [Fact]
    public void AddRankingsModule_RegistersRankingsModule()
    {
        var services = new ServiceCollection();
        services.AddSingleton(new Mock<IRankingsData>().Object);
        services.AddSingleton(new Mock<ISeasonModule>().Object);

        services.AddRankingsModule();

        var provider = services.BuildServiceProvider();
        var module = provider.GetService<IRankingsModule>();

        Assert.NotNull(module);
        Assert.IsType<RankingsModule>(module);
    }

    [Fact]
    public void AddRankingsModule_ReturnsServiceCollection()
    {
        var services = new ServiceCollection();

        var result = services.AddRankingsModule();

        Assert.Same(services, result);
    }

    [Fact]
    public void AddRankingsModule_RegistersAsSingleton()
    {
        var services = new ServiceCollection();
        services.AddSingleton(new Mock<IRankingsData>().Object);
        services.AddSingleton(new Mock<ISeasonModule>().Object);

        services.AddRankingsModule();

        var provider = services.BuildServiceProvider();

        var module1 = provider.GetService<IRankingsModule>();
        var module2 = provider.GetService<IRankingsModule>();

        Assert.Same(module1, module2);
    }

    private static IConfiguration BuildConfiguration(
        string? apiKey,
        int? calendarExpirationHours = null,
        string? connectionString = null,
        int? maxSeasonYearExpirationHours = null,
        int? seasonDataExpirationHours = null,
        int? minimumYear = null)
    {
        var configValues = new Dictionary<string, string?>();

        if (apiKey is not null)
        {
            configValues["CollegeFootballData:ApiKey"] = apiKey;
        }

        if (calendarExpirationHours.HasValue)
        {
            configValues["Cache:CalendarExpirationHours"] = calendarExpirationHours.Value.ToString();
        }

        if (connectionString is not null)
        {
            configValues["Cache:ConnectionString"] = connectionString;
        }

        if (maxSeasonYearExpirationHours.HasValue)
        {
            configValues["Cache:MaxSeasonYearExpirationHours"] = maxSeasonYearExpirationHours.Value.ToString();
        }

        if (seasonDataExpirationHours.HasValue)
        {
            configValues["Cache:SeasonDataExpirationHours"] = seasonDataExpirationHours.Value.ToString();
        }

        if (minimumYear.HasValue)
        {
            configValues["HistoricalData:MinimumYear"] = minimumYear.Value.ToString();
        }

        return new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();
    }
}
