using CFBPoll.Core.Data;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Options;

namespace CFBPoll.API.Extensions;

public static class DatabaseServiceExtensions
{
    public static IServiceCollection AddDatabase(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<DatabaseOptions>(configuration.GetSection(DatabaseOptions.SectionName));
        services.AddSingleton<IRankingsData, RankingsData>();

        return services;
    }

    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        var rankingsData = app.Services.GetRequiredService<IRankingsData>();
        await rankingsData.InitializeAsync().ConfigureAwait(false);
    }
}
