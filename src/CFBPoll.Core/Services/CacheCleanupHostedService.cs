using CFBPoll.Core.Caching;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Services;

public class CacheCleanupHostedService : BackgroundService
{
    private readonly IPersistentCache _cache;
    private readonly ILogger<CacheCleanupHostedService> _logger;
    private readonly CacheOptions _options;

    public CacheCleanupHostedService(IPersistentCache cache, IOptions<CacheOptions> options, ILogger<CacheCleanupHostedService> logger)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await DelaySafelyAsync(TimeSpan.FromMinutes(_options.CleanupStartupDelayMinutes), stoppingToken).ConfigureAwait(false);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var removed = await _cache.CleanupExpiredAsync().ConfigureAwait(false);
                _logger.LogInformation("Background cache cleanup removed {Count} expired entries", removed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background cache cleanup failed");
            }

            await DelaySafelyAsync(TimeSpan.FromMinutes(_options.CleanupIntervalMinutes), stoppingToken).ConfigureAwait(false);
        }
    }

    private static async Task DelaySafelyAsync(TimeSpan delay, CancellationToken token)
    {
        try
        {
            await Task.Delay(delay, token).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            // Expected during shutdown.
        }
    }
}
