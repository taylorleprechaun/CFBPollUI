using CFBPoll.Core.Caching;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CFBPoll.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CFBPoll.Core.Modules;

public class SeasonTrendsModule : ISeasonTrendsModule
{
    public const string CACHE_KEY_PREFIX = "season-trends_";

    private readonly IPersistentCache _cache;
    private readonly CacheOptions _cacheOptions;
    private readonly ICFBDataService _dataService;
    private readonly ILogger<SeasonTrendsModule> _logger;
    private readonly IRankingsModule _rankingsModule;
    private readonly ISeasonModule _seasonModule;

    public SeasonTrendsModule(
        IPersistentCache cache,
        IOptions<CacheOptions> cacheOptions,
        ICFBDataService dataService,
        ILogger<SeasonTrendsModule> logger,
        IRankingsModule rankingsModule,
        ISeasonModule seasonModule)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _cacheOptions = cacheOptions?.Value ?? throw new ArgumentNullException(nameof(cacheOptions));
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _seasonModule = seasonModule ?? throw new ArgumentNullException(nameof(seasonModule));
    }

    public async Task<SeasonTrendsResult> BuildFromRankingsAsync(int season, IEnumerable<RankingsResult> weeklyRankings)
    {
        var rankingsSnapshots = weeklyRankings.OrderBy(s => s.Week).ToList();

        if (rankingsSnapshots.Count == 0)
        {
            _logger.LogInformation("No weekly rankings supplied for season {Season}", season);
            return new SeasonTrendsResult { Season = season };
        }

        var calendarTask = _dataService.GetCalendarAsync(season);
        var teamsTask = _dataService.GetFBSTeamsAsync(season);

        await Task.WhenAll(calendarTask, teamsTask).ConfigureAwait(false);

        var calendar = await calendarTask;
        var fbsTeams = await teamsTask;

        var weekLabels = _seasonModule.GetWeekLabels(calendar)
            .ToDictionary(w => w.WeekNumber, w => w.Label);

        var teamColorLookup = fbsTeams.ToDictionary(
            t => t.Name,
            t => t,
            StringComparer.OrdinalIgnoreCase);

        var publishedWeekNumbers = rankingsSnapshots.Select(s => s.Week).ToList();

        var teamRankings = new Dictionary<string, List<SeasonTrendRanking>>(StringComparer.OrdinalIgnoreCase);
        var teamMetadata = new Dictionary<string, (string Conference, string LogoURL)>(StringComparer.OrdinalIgnoreCase);

        foreach (var rankingsSnapshot in rankingsSnapshots)
        {
            var rankedTeamNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var team in rankingsSnapshot.Rankings.Where(t => t.Rank <= 25))
            {
                rankedTeamNames.Add(team.TeamName);

                if (!teamRankings.ContainsKey(team.TeamName))
                {
                    teamRankings[team.TeamName] = new List<SeasonTrendRanking>();
                    teamMetadata[team.TeamName] = (team.Conference, team.LogoURL);
                }

                teamRankings[team.TeamName].Add(new SeasonTrendRanking
                {
                    Rank = team.Rank,
                    Rating = team.Rating,
                    Record = $"{team.Wins}-{team.Losses}",
                    WeekNumber = rankingsSnapshot.Week
                });
            }

            foreach (var teamName in teamRankings.Keys)
            {
                if (!rankedTeamNames.Contains(teamName))
                {
                    if (!teamRankings[teamName].Any(r => r.WeekNumber == rankingsSnapshot.Week))
                    {
                        teamRankings[teamName].Add(new SeasonTrendRanking
                        {
                            Rank = null,
                            Rating = 0,
                            Record = string.Empty,
                            WeekNumber = rankingsSnapshot.Week
                        });
                    }
                }
            }
        }

        var weeks = publishedWeekNumbers
            .Select(w => new SeasonTrendWeek
            {
                Label = weekLabels.TryGetValue(w, out var label) ? label : $"Week {w}",
                WeekNumber = w
            })
            .ToList();

        var teams = teamRankings
            .OrderBy(kvp => kvp.Key, StringComparer.OrdinalIgnoreCase)
            .Select(kvp =>
            {
                var (conference, logoURL) = teamMetadata[kvp.Key];
                teamColorLookup.TryGetValue(kvp.Key, out var fbsTeam);

                return new SeasonTrendTeam
                {
                    AltColor = fbsTeam?.AltColor ?? string.Empty,
                    Color = fbsTeam?.Color ?? string.Empty,
                    Conference = conference,
                    LogoURL = logoURL,
                    Rankings = kvp.Value,
                    TeamName = kvp.Key
                };
            })
            .ToList();

        return new SeasonTrendsResult
        {
            Season = season,
            Teams = teams,
            Weeks = weeks
        };
    }

    public async Task<SeasonTrendsResult> GetSeasonTrendsAsync(int season)
    {
        var cacheKey = $"{CACHE_KEY_PREFIX}{season}";
        var cached = await _cache.GetAsync<SeasonTrendsResult>(cacheKey).ConfigureAwait(false);

        if (cached is not null)
        {
            _logger.LogDebug("Cache hit for season trends {Season}", season);
            return cached;
        }

        _logger.LogInformation("Computing season trends for season {Season}", season);

        var rankingsSnapshots = (await _rankingsModule.GetPublishedRankingsSnapshotsBySeasonRangeAsync(season, season).ConfigureAwait(false)).ToList();
        var result = await BuildFromRankingsAsync(season, rankingsSnapshots).ConfigureAwait(false);

        if (rankingsSnapshots.Count == 0)
        {
            _logger.LogInformation("No published rankings snapshots found for season {Season}", season);
            return result;
        }

        var expiresAt = DateTime.UtcNow.AddHours(_cacheOptions.SeasonTrendsExpirationHours);
        await _cache.SetAsync(cacheKey, result, expiresAt).ConfigureAwait(false);

        return result;
    }

    public async Task InvalidateCacheAsync()
    {
        var count = await _cache.RemoveByPrefixAsync(CACHE_KEY_PREFIX).ConfigureAwait(false);
        _logger.LogDebug("Invalidated {Count} season trends cache entries", count);
    }
}
