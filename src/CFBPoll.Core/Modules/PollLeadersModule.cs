using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Modules;

public class PollLeadersModule : IPollLeadersModule
{
    public const string CACHE_KEY_PREFIX = "poll-leaders_";

    private readonly IPersistentCache _cache;
    private readonly CacheOptions _cacheOptions;
    private readonly ICFBDataService _dataService;
    private readonly ILogger<PollLeadersModule> _logger;
    private readonly IRankingsModule _rankingsModule;
    private readonly StringComparison _scoic = StringComparison.OrdinalIgnoreCase;

    public PollLeadersModule(
        IPersistentCache cache,
        IOptions<CacheOptions> cacheOptions,
        ICFBDataService dataService,
        ILogger<PollLeadersModule> logger,
        IRankingsModule rankingsModule)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _cacheOptions = cacheOptions?.Value ?? throw new ArgumentNullException(nameof(cacheOptions));
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
    }

    public async Task InvalidateCacheAsync()
    {
        var count = await _cache.RemoveByPrefixAsync(CACHE_KEY_PREFIX).ConfigureAwait(false);
        _logger.LogDebug("Invalidated {Count} poll leaders cache entries", count);
    }

    public async Task<PollLeadersResult> GetPollLeadersAsync(int? minSeason, int? maxSeason)
    {
        var snapshots = await _rankingsModule.GetSnapshotsAsync().ConfigureAwait(false);
        var publishedWeeks = snapshots.Where(pw => pw.IsPublished).ToList();

        if (publishedWeeks.Count == 0)
        {
            _logger.LogInformation("No published snapshots found");
            return new PollLeadersResult();
        }

        var minAvailable = publishedWeeks.Min(pw => pw.Season);
        var maxAvailable = publishedWeeks.Max(pw => pw.Season);

        var effectiveMin = minSeason ?? minAvailable;
        var effectiveMax = maxSeason ?? maxAvailable;

        var cacheKey = $"{CACHE_KEY_PREFIX}{effectiveMin}_{effectiveMax}";
        var cached = await _cache.GetAsync<PollLeadersResult>(cacheKey).ConfigureAwait(false);

        if (cached is not null)
        {
            _logger.LogDebug("Cache hit for poll leaders {MinSeason} to {MaxSeason}", effectiveMin, effectiveMax);
            return cached;
        }

        _logger.LogInformation(
            "Computing poll leaders for seasons {MinSeason} to {MaxSeason}",
            effectiveMin, effectiveMax);

        var filteredWeeks = publishedWeeks
            .Where(pw => pw.Season >= effectiveMin && pw.Season <= effectiveMax)
            .ToList();

        var allSnapshots = (await _rankingsModule
            .GetPublishedSnapshotsBySeasonRangeAsync(effectiveMin, effectiveMax)
            .ConfigureAwait(false))
            .ToList();

        var allWeeksEntries = BuildAllWeeksEntries(allSnapshots);
        var finalWeeksEntries = await BuildFinalWeeksEntriesAsync(filteredWeeks, allSnapshots)
            .ConfigureAwait(false);

        var result = new PollLeadersResult
        {
            AllWeeks = allWeeksEntries,
            FinalWeeksOnly = finalWeeksEntries,
            MaxAvailableSeason = maxAvailable,
            MinAvailableSeason = minAvailable
        };

        var expiresAt = DateTime.UtcNow.AddHours(_cacheOptions.PollLeadersExpirationHours);
        await _cache.SetAsync(cacheKey, result, expiresAt).ConfigureAwait(false);

        return result;
    }

    private void AggregateSnapshot(
        IDictionary<string, PollLeaderEntry> counts,
        RankingsResult snapshot)
    {
        foreach (var team in snapshot.Rankings)
        {
            if (!counts.TryGetValue(team.TeamName, out var entry))
            {
                entry = new PollLeaderEntry
                {
                    LogoURL = team.LogoURL,
                    TeamName = team.TeamName
                };
                counts[team.TeamName] = entry;
            }

            if (string.IsNullOrEmpty(entry.LogoURL) && !string.IsNullOrEmpty(team.LogoURL))
                entry.LogoURL = team.LogoURL;

            if (team.Rank <= 25) entry.Top25Count++;
            if (team.Rank <= 10) entry.Top10Count++;
            if (team.Rank <= 5) entry.Top5Count++;
        }
    }

    private IReadOnlyList<PollLeaderEntry> BuildAllWeeksEntries(
        IReadOnlyList<RankingsResult> snapshots)
    {
        var counts = new Dictionary<string, PollLeaderEntry>(StringComparer.OrdinalIgnoreCase);
        var aggregatedCount = 0;

        foreach (var snapshot in snapshots)
        {
            AggregateSnapshot(counts, snapshot);
            aggregatedCount++;
        }

        _logger.LogInformation("All-weeks mode: aggregated {Count} snapshots", aggregatedCount);

        return SortAndFilter(counts);
    }

    private async Task<IReadOnlyList<PollLeaderEntry>> BuildFinalWeeksEntriesAsync(
        IReadOnlyList<SnapshotSummary> publishedWeeks,
        IReadOnlyList<RankingsResult> allSnapshots)
    {
        var snapshotLookup = allSnapshots
            .ToDictionary(s => (s.Season, s.Week));

        var seasons = publishedWeeks
            .Select(pw => pw.Season)
            .Distinct()
            .OrderBy(s => s)
            .ToList();

        var counts = new Dictionary<string, PollLeaderEntry>(StringComparer.OrdinalIgnoreCase);
        var aggregatedCount = 0;

        foreach (var season in seasons)
        {
            var calendar = await _dataService.GetCalendarAsync(season).ConfigureAwait(false);
            var postseasonWeek = calendar
                .FirstOrDefault(w => w.SeasonType.Equals("postseason", _scoic));

            if (postseasonWeek is null)
            {
                _logger.LogDebug("No postseason week found in calendar for season {Season}", season);
                continue;
            }

            if (!snapshotLookup.TryGetValue((season, postseasonWeek.Week), out var snapshot))
            {
                _logger.LogDebug("No published postseason snapshot for season {Season}, week {Week}",
                    season, postseasonWeek.Week);
                continue;
            }

            AggregateSnapshot(counts, snapshot);
            aggregatedCount++;
        }

        _logger.LogInformation("Final-weeks mode: aggregated {Count} postseason snapshots", aggregatedCount);

        return SortAndFilter(counts);
    }

    private IReadOnlyList<PollLeaderEntry> SortAndFilter(
        IDictionary<string, PollLeaderEntry> counts)
    {
        return counts.Values
            .Where(e => e.Top25Count > 0)
            .OrderByDescending(e => e.Top25Count)
            .ThenByDescending(e => e.Top10Count)
            .ThenByDescending(e => e.Top5Count)
            .ToList();
    }
}
