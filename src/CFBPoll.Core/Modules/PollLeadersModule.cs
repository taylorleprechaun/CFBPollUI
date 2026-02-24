using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Modules;

public class PollLeadersModule : IPollLeadersModule
{
    private readonly ICFBDataService _dataService;
    private readonly ILogger<PollLeadersModule> _logger;
    private readonly IRankingsModule _rankingsModule;
    private readonly StringComparison _scoic = StringComparison.OrdinalIgnoreCase;

    public PollLeadersModule(
        ICFBDataService dataService,
        IRankingsModule rankingsModule,
        ILogger<PollLeadersModule> logger)
    {
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<PollLeadersResult> GetPollLeadersAsync(int? minSeason, int? maxSeason)
    {
        var persistedWeeks = await _rankingsModule.GetPersistedWeeksAsync().ConfigureAwait(false);
        var publishedWeeks = persistedWeeks.Where(pw => pw.Published).ToList();

        if (publishedWeeks.Count == 0)
        {
            _logger.LogInformation("No published snapshots found");
            return new PollLeadersResult();
        }

        var minAvailable = publishedWeeks.Min(pw => pw.Season);
        var maxAvailable = publishedWeeks.Max(pw => pw.Season);

        var effectiveMin = minSeason ?? minAvailable;
        var effectiveMax = maxSeason ?? maxAvailable;

        _logger.LogInformation(
            "Computing poll leaders for seasons {MinSeason} to {MaxSeason}",
            effectiveMin, effectiveMax);

        var filteredWeeks = publishedWeeks
            .Where(pw => pw.Season >= effectiveMin && pw.Season <= effectiveMax)
            .ToList();

        var allWeeksEntries = await BuildAllWeeksEntriesAsync(filteredWeeks).ConfigureAwait(false);
        var finalWeeksEntries = await BuildFinalWeeksEntriesAsync(filteredWeeks).ConfigureAwait(false);

        return new PollLeadersResult
        {
            AllWeeks = allWeeksEntries,
            FinalWeeksOnly = finalWeeksEntries,
            MaxAvailableSeason = maxAvailable,
            MinAvailableSeason = minAvailable
        };
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

    private async Task<IReadOnlyList<PollLeaderEntry>> BuildAllWeeksEntriesAsync(
        IReadOnlyList<PersistedWeekSummary> publishedWeeks)
    {
        var counts = new Dictionary<string, PollLeaderEntry>(StringComparer.OrdinalIgnoreCase);
        var aggregatedCount = 0;

        foreach (var week in publishedWeeks)
        {
            var snapshot = await _rankingsModule.GetPublishedSnapshotAsync(week.Season, week.Week)
                .ConfigureAwait(false);

            if (snapshot is null)
                continue;

            AggregateSnapshot(counts, snapshot);
            aggregatedCount++;
        }

        _logger.LogInformation("All-weeks mode: aggregated {Count} snapshots", aggregatedCount);

        return SortAndFilter(counts);
    }

    private async Task<IReadOnlyList<PollLeaderEntry>> BuildFinalWeeksEntriesAsync(
        IReadOnlyList<PersistedWeekSummary> publishedWeeks)
    {
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

            var snapshot = await _rankingsModule.GetPublishedSnapshotAsync(season, postseasonWeek.Week)
                .ConfigureAwait(false);

            if (snapshot is null)
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
