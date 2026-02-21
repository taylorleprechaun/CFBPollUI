using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Modules;

public class AllTimeModule : IAllTimeModule
{
    private const double BEST_TEAMS_THRESHOLD = 40.0;
    private const int LIST_SIZE = 25;
    private const double WORST_TEAMS_THRESHOLD = 16.0;

    private readonly ICFBDataService _dataService;
    private readonly ILogger<AllTimeModule> _logger;
    private readonly IRankingsModule _rankingsModule;
    private readonly StringComparison _scoic = StringComparison.OrdinalIgnoreCase;

    public AllTimeModule(
        ICFBDataService dataService,
        IRankingsModule rankingsModule,
        ILogger<AllTimeModule> logger)
    {
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<AllTimeResult> GetAllTimeRankingsAsync()
    {
        var postseasonSnapshots = await GetPostseasonSnapshotsAsync().ConfigureAwait(false);

        var allEntries = postseasonSnapshots
            .SelectMany(snapshot => snapshot.Rankings.Select(team => new AllTimeEntry
            {
                LogoURL = team.LogoURL,
                Losses = team.Losses,
                Rank = team.Rank,
                Rating = team.Rating,
                Season = snapshot.Season,
                TeamName = team.TeamName,
                WeightedSOS = team.WeightedSOS,
                Week = snapshot.Week,
                Wins = team.Wins
            }))
            .ToList();

        return new AllTimeResult
        {
            BestTeams = BuildBestTeams(allEntries),
            HardestSchedules = BuildHardestSchedules(allEntries),
            WorstTeams = BuildWorstTeams(allEntries)
        };
    }

    private IReadOnlyList<AllTimeEntry> BuildBestTeams(IReadOnlyList<AllTimeEntry> allEntries)
    {
        var candidates = allEntries
            .Where(e => e.Rating >= BEST_TEAMS_THRESHOLD)
            .OrderByDescending(e => e.Rating)
            .ToList();

        if (candidates.Count < LIST_SIZE)
        {
            return AssignRanks(allEntries
                .OrderByDescending(e => e.Rating)
                .Take(LIST_SIZE));
        }

        return AssignRanks(candidates.Take(LIST_SIZE));
    }

    private IReadOnlyList<AllTimeEntry> BuildHardestSchedules(IReadOnlyList<AllTimeEntry> allEntries)
    {
        return AssignRanks(allEntries
            .OrderByDescending(e => e.WeightedSOS)
            .Take(LIST_SIZE));
    }

    private IReadOnlyList<AllTimeEntry> BuildWorstTeams(IReadOnlyList<AllTimeEntry> allEntries)
    {
        var eligible = allEntries
            .Where(e => e.Wins + e.Losses > 0)
            .ToList();

        var candidates = eligible
            .Where(e => e.Rating <= WORST_TEAMS_THRESHOLD)
            .OrderBy(e => e.Rating)
            .ToList();

        if (candidates.Count < LIST_SIZE)
        {
            return AssignRanks(eligible
                .OrderBy(e => e.Rating)
                .Take(LIST_SIZE));
        }

        return AssignRanks(candidates.Take(LIST_SIZE));
    }

    private async Task<IReadOnlyList<RankingsResult>> GetPostseasonSnapshotsAsync()
    {
        var persistedWeeks = await _rankingsModule.GetPersistedWeeksAsync().ConfigureAwait(false);

        var publishedSeasons = persistedWeeks
            .Where(pw => pw.Published)
            .Select(pw => pw.Season)
            .Distinct()
            .OrderBy(s => s)
            .ToList();

        _logger.LogInformation("Found {Count} seasons with published snapshots", publishedSeasons.Count);

        var snapshots = new List<RankingsResult>();

        foreach (var season in publishedSeasons)
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

            snapshots.Add(snapshot);
        }

        _logger.LogInformation("Loaded {Count} postseason snapshots", snapshots.Count);
        return snapshots;
    }

    private static IReadOnlyList<AllTimeEntry> AssignRanks(IEnumerable<AllTimeEntry> entries)
    {
        return entries.Select((e, i) => new AllTimeEntry
        {
            AllTimeRank = i + 1,
            LogoURL = e.LogoURL,
            Losses = e.Losses,
            Rank = e.Rank,
            Rating = e.Rating,
            Season = e.Season,
            TeamName = e.TeamName,
            WeightedSOS = e.WeightedSOS,
            Week = e.Week,
            Wins = e.Wins
        }).ToList();
    }
}
