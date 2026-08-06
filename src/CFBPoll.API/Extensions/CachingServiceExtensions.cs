using CFBPoll.Core.Caching;
using CFBPoll.Core.Data;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Modules;
using CFBPoll.Core.Options;
using CFBPoll.Core.Services;

namespace CFBPoll.API.Extensions;

public static class CachingServiceExtensions
{
    public static IServiceCollection AddCFBDataServiceWithCaching(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<CacheOptions>(configuration.GetSection(CacheOptions.SECTION_NAME));

        services.AddSingleton<ICacheData, CacheData>();
        services.AddSingleton<IPersistentCache, CacheModule>();
        services.AddHostedService<CacheCleanupHostedService>();

        string apiKey = configuration["CollegeFootballData:ApiKey"]
            ?? throw new InvalidOperationException(
                "API key not configured. Set CollegeFootballData:ApiKey in appsettings.json or appsettings-private.json");

        int minimumYear = configuration.GetValue<int>("HistoricalData:MinimumYear", 2002);
        string preferredBettingProvider = configuration.GetValue<string>("BettingLines:PreferredProvider", "Bovada")!;

        services.AddHttpClient<CFBDataService>();

        services.AddSingleton<CFBDataService>(sp =>
        {
            var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
            HttpClient httpClient = httpClientFactory.CreateClient(nameof(CFBDataService));
            return new CFBDataService(httpClient, apiKey, minimumYear, preferredBettingProvider, sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<CFBDataService>>());
        });

        services.AddSingleton<ICFBDataService>(sp =>
        {
            var innerService = sp.GetRequiredService<CFBDataService>();
            var cache = sp.GetRequiredService<IPersistentCache>();
            var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<CacheOptions>>();
            var logger = sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<CachingCFBDataService>>();

            return new CachingCFBDataService(innerService, cache, options, logger);
        });

        return services;
    }

    public static IServiceCollection AddRankingsModule(this IServiceCollection services)
    {
        services.AddSingleton<IRankingsModule, RankingsModule>();

        return services;
    }

    public static async Task InitializeCacheAsync(this WebApplication app)
    {
        var cacheData = app.Services.GetRequiredService<ICacheData>();
        await cacheData.InitializeAsync().ConfigureAwait(false);
    }
}
