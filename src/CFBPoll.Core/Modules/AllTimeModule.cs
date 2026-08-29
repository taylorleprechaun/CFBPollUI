using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Modules;

public class AllTimeModule : IAllTimeModule
{
    private const int LIST_SIZE = 25;

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
        var postseasonRankingsSnapshots = await GetPostseasonRankingsSnapshotsAsync().ConfigureAwait(false);

        var allEntries = postseasonRankingsSnapshots
            .SelectMany(rankingsSnapshot =>
            {
                var seasonRatings = rankingsSnapshot.Rankings.Select(t => t.Rating).ToList();
                var mean = CalculateMean(seasonRatings);
                var stdDev = CalculatePopulationStandardDeviation(seasonRatings, mean);

                return rankingsSnapshot.Rankings.Select(team => new AllTimeEntry
                {
                    LogoURL = team.LogoURL,
                    Losses = team.Losses,
                    Rank = team.Rank,
                    Rating = team.Rating,
                    RatingZScore = CalculateZScore(team.Rating, mean, stdDev),
                    Season = rankingsSnapshot.Season,
                    TeamName = team.TeamName,
                    WeightedSOS = team.WeightedSOS,
                    Week = rankingsSnapshot.Week,
                    Wins = team.Wins
                });
            })
            .ToList();

        return new AllTimeResult
        {
            BestTeams = BuildBestTeams(allEntries),
            HardestSchedules = BuildHardestSchedules(allEntries),
            WorstTeams = BuildWorstTeams(allEntries)
        };
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
            RatingZScore = e.RatingZScore,
            Season = e.Season,
            TeamName = e.TeamName,
            WeightedSOS = e.WeightedSOS,
            Week = e.Week,
            Wins = e.Wins
        }).ToList();
    }

    private static IReadOnlyList<AllTimeEntry> BuildBestTeams(IReadOnlyList<AllTimeEntry> allEntries)
    {
        return AssignRanks(allEntries
            .OrderByDescending(e => e.RatingZScore)
            .Take(LIST_SIZE));
    }

    private static IReadOnlyList<AllTimeEntry> BuildHardestSchedules(IReadOnlyList<AllTimeEntry> allEntries)
    {
        return AssignRanks(allEntries
            .OrderByDescending(e => e.WeightedSOS)
            .Take(LIST_SIZE));
    }

    private static IReadOnlyList<AllTimeEntry> BuildWorstTeams(IReadOnlyList<AllTimeEntry> allEntries)
    {
        return AssignRanks(allEntries
            .Where(e => e.Wins + e.Losses > 0)
            .OrderBy(e => e.RatingZScore)
            .Take(LIST_SIZE));
    }

    private static double CalculateMean(IReadOnlyList<double> values)
    {
        if (values.Count == 0) return 0.0;

        return values.Average();
    }

    private static double CalculatePopulationStandardDeviation(IReadOnlyList<double> values, double mean)
    {
        if (values.Count == 0) return 0.0;

        var sumOfSquaredDeviations = values.Sum(v => Math.Pow(v - mean, 2));
        return Math.Sqrt(sumOfSquaredDeviations / values.Count);
    }

    private static double CalculateZScore(double rating, double mean, double stdDev)
    {
        if (stdDev == 0) return 0.0;

        return (rating - mean) / stdDev;
    }

    private async Task<IReadOnlyList<RankingsResult>> GetPostseasonRankingsSnapshotsAsync()
    {
        var rankingsSnapshots = await _rankingsModule.GetRankingsSnapshotsAsync().ConfigureAwait(false);

        var publishedSeasons = rankingsSnapshots
            .Where(pw => pw.IsPublished)
            .Select(pw => pw.Season)
            .Distinct()
            .OrderBy(s => s)
            .ToList();

        _logger.LogInformation("Found {Count} seasons with published rankings snapshots", publishedSeasons.Count);

        var results = new List<RankingsResult>();

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

            var rankingsSnapshot = await _rankingsModule.GetPublishedRankingsSnapshotAsync(season, postseasonWeek.Week)
                .ConfigureAwait(false);

            if (rankingsSnapshot is null)
            {
                _logger.LogDebug("No published postseason rankings snapshot for season {Season}, week {Week}",
                    season, postseasonWeek.Week);
                continue;
            }

            results.Add(rankingsSnapshot);
        }

        _logger.LogInformation("Loaded {Count} postseason rankings snapshots", results.Count);
        return results;
    }
}
