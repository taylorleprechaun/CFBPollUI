using CFBPoll.API.Extensions;
using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Modules;
using CFBPoll.Core.Options;
using CFBPoll.Core.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
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
        Assert.IsType<FilePersistentCache>(cache);
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
    public void AddRankingsModuleWithCaching_RegistersRankingsModule()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        RegisterCacheDependencies(services);

        services.AddRankingsModuleWithCaching();

        var provider = services.BuildServiceProvider();
        var module = provider.GetService<RankingsModule>();

        Assert.NotNull(module);
    }

    [Fact]
    public void AddRankingsModuleWithCaching_RegistersIRankingsModuleAsCachingModule()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        RegisterCacheDependencies(services);

        services.AddRankingsModuleWithCaching();

        var provider = services.BuildServiceProvider();
        var module = provider.GetService<IRankingsModule>();

        Assert.NotNull(module);
        Assert.IsType<CachingRankingsModule>(module);
    }

    [Fact]
    public void AddRankingsModuleWithCaching_ReturnsServiceCollection()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        RegisterCacheDependencies(services);

        var result = services.AddRankingsModuleWithCaching();

        Assert.Same(services, result);
    }

    [Fact]
    public void AddRankingsModuleWithCaching_RegistersServicesAsSingletons()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        RegisterCacheDependencies(services);

        services.AddRankingsModuleWithCaching();

        var provider = services.BuildServiceProvider();

        var module1 = provider.GetService<IRankingsModule>();
        var module2 = provider.GetService<IRankingsModule>();

        Assert.Same(module1, module2);
    }

    [Fact]
    public void AddRankingsModuleWithCaching_CachingModuleWrapsInnerModule()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        RegisterCacheDependencies(services);

        services.AddRankingsModuleWithCaching();

        var provider = services.BuildServiceProvider();

        var cachingModule = provider.GetService<IRankingsModule>();
        var innerModule = provider.GetService<RankingsModule>();

        Assert.NotNull(cachingModule);
        Assert.NotNull(innerModule);
        Assert.IsType<CachingRankingsModule>(cachingModule);
        Assert.IsType<RankingsModule>(innerModule);
    }

    private static void RegisterCacheDependencies(IServiceCollection services)
    {
        services.AddSingleton<IPersistentCache, FilePersistentCache>();
        services.Configure<CacheOptions>(_ => { });
    }

    private static IConfiguration BuildConfiguration(
        string? apiKey,
        int? calendarExpirationHours = null,
        int? maxSeasonYearExpirationHours = null,
        int? seasonDataExpirationHours = null,
        int? minimumYear = null)
    {
        var configValues = new Dictionary<string, string?>();

        if (apiKey != null)
        {
            configValues["CollegeFootballData:ApiKey"] = apiKey;
        }

        if (calendarExpirationHours.HasValue)
        {
            configValues["Cache:CalendarExpirationHours"] = calendarExpirationHours.Value.ToString();
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
