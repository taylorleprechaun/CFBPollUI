using System.Diagnostics.CodeAnalysis;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CollegeFootballData;
using ApiModels = CollegeFootballData.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Kiota.Abstractions.Authentication;
using Microsoft.Kiota.Http.HttpClientLibrary;

namespace CFBPoll.Core.Services;

[ExcludeFromCodeCoverage]
public class CFBDataService : ICFBDataService
{
    private readonly ApiClient _client;
    private readonly ILogger<CFBDataService> _logger;
    private readonly int _minimumYear;
    private readonly StringComparison _scoic = StringComparison.OrdinalIgnoreCase;

    public CFBDataService(HttpClient httpClient, string apiKey, int minimumYear, ILogger<CFBDataService> logger)
    {
        _minimumYear = minimumYear;
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        var authProvider = new BaseBearerTokenAuthenticationProvider(new StaticAccessTokenProvider(apiKey));
        var requestAdapter = new HttpClientRequestAdapter(authProvider, httpClient: httpClient);
        _client = new ApiClient(requestAdapter);
    }

    public async Task<IEnumerable<AdvancedGameStats>> GetAdvancedGameStatsAsync(int season, string seasonType)
    {
        try
        {
            var response = await _client.Stats.Game.Advanced.GetAsync(config =>
            {
                config.QueryParameters.Year = season;
                config.QueryParameters.SeasonTypeAsSeasonType = seasonType.Equals("regular", _scoic)
                    ? ApiModels.SeasonType.Regular
                    : ApiModels.SeasonType.Postseason;
            });

            if (response is null)
                return [];

            return response.Select(MapAdvancedGameStats);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch advanced game stats for season {Season}, type {SeasonType}", season, seasonType);
            return [];
        }
    }

    public async Task<IEnumerable<CalendarWeek>> GetCalendarAsync(int year)
    {
        var calendarResponse = await _client.Calendar.GetAsync(config =>
        {
            config.QueryParameters.Year = year;
        });

        if (calendarResponse is null)
            return [];

        var weeks = new List<CalendarWeek>();
        var maxRegularWeek = 0;

        foreach (var week in calendarResponse)
        {
            var seasonType = week.SeasonType?.ToString() ?? "regular";
            var weekNumber = week.Week ?? 0;

            if (seasonType.Equals("regular", _scoic))
            {
                if (weekNumber > maxRegularWeek)
                    maxRegularWeek = weekNumber;

                weeks.Add(new CalendarWeek
                {
                    Week = weekNumber,
                    SeasonType = seasonType,
                    StartDate = week.StartDate?.DateTime ?? DateTime.MinValue,
                    EndDate = week.EndDate?.DateTime ?? DateTime.MinValue
                });
            }
        }

        var hasPostseason = calendarResponse.Any(w =>
            (w.SeasonType?.ToString() ?? "").Equals("postseason", _scoic));

        if (hasPostseason)
        {
            var postseasonWeeks = calendarResponse.Where(w =>
                (w.SeasonType?.ToString() ?? "").Equals("postseason", _scoic));

            var minStart = postseasonWeeks
                .Min(w => w.StartDate?.DateTime ?? DateTime.MaxValue);
            var maxEnd = postseasonWeeks
                .Max(w => w.EndDate?.DateTime ?? DateTime.MinValue);

            weeks.Add(new CalendarWeek
            {
                Week = maxRegularWeek + 1,
                SeasonType = "postseason",
                StartDate = minStart,
                EndDate = maxEnd
            });
        }

        return weeks.OrderBy(w => w.Week);
    }

    public async Task<IEnumerable<FBSTeam>> GetFBSTeamsAsync(int season)
    {
        try
        {
            var teamsResponse = await _client.Teams.Fbs.GetAsync(config =>
            {
                config.QueryParameters.Year = season;
            });

            if (teamsResponse is null)
                return [];

            return teamsResponse
                .Where(t => !string.IsNullOrEmpty(t.School))
                .Select(t => new FBSTeam
                {
                    AltColor = t.AlternateColor ?? string.Empty,
                    Color = t.Color ?? string.Empty,
                    Conference = t.Conference ?? string.Empty,
                    Division = t.Division ?? string.Empty,
                    LogoURL = t.Logos?.FirstOrDefault() ?? string.Empty,
                    Name = t.School!
                });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch FBS teams for season {Season}", season);
            return [];
        }
    }

    public async Task<IEnumerable<Game>> GetGamesAsync(int season, string seasonType)
    {
        try
        {
            var seasonTypeEnum = seasonType.Equals("regular", _scoic)
                ? ApiModels.SeasonType.Regular
                : ApiModels.SeasonType.Postseason;

            var response = await _client.Games.GetAsync(config =>
            {
                config.QueryParameters.Year = season;
                config.QueryParameters.SeasonTypeAsSeasonType = seasonTypeEnum;
            });

            if (response is null)
                return [];

            return response
                .Where(g => g.HomePoints.HasValue && g.AwayPoints.HasValue)
                .Select(g => MapGame(g, seasonType));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch games for season {Season}, type {SeasonType}", season, seasonType);
            return [];
        }
    }

    public async Task<IDictionary<string, IEnumerable<TeamStat>>> GetSeasonTeamStatsAsync(int season, int? endWeek)
    {
        try
        {
            var response = await _client.Stats.Season.GetAsync(config =>
            {
                config.QueryParameters.Year = season;
                config.QueryParameters.EndWeek = endWeek;
            });

            if (response is null)
                return new Dictionary<string, IEnumerable<TeamStat>>();

            return MapTeamStats(response);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch season team stats for season {Season}, endWeek {EndWeek}", season, endWeek);
            return new Dictionary<string, IEnumerable<TeamStat>>();
        }
    }

    public async Task<IEnumerable<Conference>> GetConferencesAsync()
    {
        var conferencesResponse = await _client.Conferences.GetAsync();

        if (conferencesResponse is null)
            return [];

        return conferencesResponse
            .Where(c => c.Classification?.ToString().Equals("fbs", _scoic) == true)
            .Select(c => new Conference
            {
                Abbreviation = c.Abbreviation ?? string.Empty,
                ID = c.Id ?? 0,
                Name = c.Name ?? string.Empty,
                ShortName = c.ShortName ?? string.Empty
            });
    }

    public async Task<int> GetMaxSeasonYearAsync()
    {
        var currentYear = DateTime.UtcNow.Year;

        for (var year = currentYear; year >= _minimumYear; year--)
        {
            var calendar = await GetCalendarAsync(year);
            var calendarList = calendar.ToList();

            if (!calendarList.Any())
                continue;

            var allFuture = calendarList.All(w => w.EndDate > DateTime.UtcNow);
            if (!allFuture)
                return year;
        }

        return _minimumYear;
    }

    public async Task<SeasonData> GetSeasonDataAsync(int season, int week)
    {
        var (teamsResponse, gamesResponse, postseasonGames) = await FetchRawSeasonDataAsync(season);
        var allGames = BuildCompletedGameList(gamesResponse, postseasonGames, week);
        await AttachAdvancedStatsAsync(allGames, season, week, gamesResponse);
        var seasonStats = await GetSeasonStatsAsync(season, week, allGames);
        IDictionary<string, TeamInfo> teamDict = BuildTeamDictionary(teamsResponse, allGames, seasonStats);

        return new SeasonData
        {
            Games = allGames,
            Season = season,
            Teams = teamDict,
            Week = week
        };
    }

    public async Task<IEnumerable<ScheduleGame>> GetFullSeasonScheduleAsync(int season)
    {
        var regularGames = await _client.Games.GetAsync(config =>
        {
            config.QueryParameters.Year = season;
            config.QueryParameters.SeasonTypeAsSeasonType = ApiModels.SeasonType.Regular;
        });

        var postseasonGames = await _client.Games.GetAsync(config =>
        {
            config.QueryParameters.Year = season;
            config.QueryParameters.SeasonTypeAsSeasonType = ApiModels.SeasonType.Postseason;
        });

        var allGames = (regularGames ?? []).Select(g => MapScheduleGame(g, "regular"))
            .Concat((postseasonGames ?? []).Select(g => MapScheduleGame(g, "postseason")));

        return allGames;
    }

    private async Task AttachAdvancedStatsAsync(
        IEnumerable<Game> allGames,
        int season,
        int week,
        IEnumerable<ApiModels.Game>? gamesResponse)
    {
        var maxRegularSeasonWeek = (gamesResponse ?? [])
            .Where(g => g.Week.HasValue)
            .Select(g => g.Week!.Value)
            .DefaultIfEmpty(0)
            .Max();

        var includePostseason = week > maxRegularSeasonWeek;

        var regularAdvancedStats = await GetAdvancedGameStatsAsync(season, "regular");
        var postseasonAdvancedStats = includePostseason
            ? await GetAdvancedGameStatsAsync(season, "postseason")
            : Enumerable.Empty<AdvancedGameStats>();

        var advancedStatsLookup = regularAdvancedStats
            .Concat(postseasonAdvancedStats)
            .Where(s => s.GameID.HasValue && !string.IsNullOrEmpty(s.Team))
            .ToDictionary(s => (s.Team!, s.GameID!.Value), s => s);

        foreach (var game in allGames)
        {
            if (!game.GameID.HasValue)
                continue;

            if (advancedStatsLookup.TryGetValue((game.HomeTeam ?? string.Empty, game.GameID.Value), out var homeStats))
            {
                game.HomeAdvancedStats = homeStats;
            }

            if (advancedStatsLookup.TryGetValue((game.AwayTeam ?? string.Empty, game.GameID.Value), out var awayStats))
            {
                game.AwayAdvancedStats = awayStats;
            }
        }
    }

    private IEnumerable<Game> BuildCompletedGameList(
        IEnumerable<ApiModels.Game>? gamesResponse,
        IEnumerable<ApiModels.Game>? postseasonGames,
        int week)
    {
        var regularGames = (gamesResponse ?? [])
            .Where(g => g.Week <= week && g.HomePoints.HasValue && g.AwayPoints.HasValue)
            .Select(g => MapGame(g, "regular"));

        var maxRegularSeasonWeek = (gamesResponse ?? [])
            .Where(g => g.Week.HasValue)
            .Select(g => g.Week!.Value)
            .DefaultIfEmpty(0)
            .Max();

        var includePostseason = week > maxRegularSeasonWeek;

        var postGames = includePostseason
            ? (postseasonGames ?? [])
                .Where(g => g.HomePoints.HasValue && g.AwayPoints.HasValue)
                .Select(g => MapGame(g, "postseason"))
            : Enumerable.Empty<Game>();

        return regularGames.Concat(postGames).ToList();
    }

    private IDictionary<string, TeamInfo> BuildTeamDictionary(
        IEnumerable<ApiModels.Team>? teamsResponse,
        IEnumerable<Game> allGames,
        IDictionary<string, IEnumerable<TeamStat>> seasonStats)
    {
        var teamDict = new Dictionary<string, TeamInfo>();

        foreach (var team in teamsResponse ?? [])
        {
            var teamName = team.School;
            if (string.IsNullOrEmpty(teamName))
                continue;

            var teamGames = allGames.Where(g =>
                teamName.Equals(g.HomeTeam, _scoic) || teamName.Equals(g.AwayTeam, _scoic)).ToList();

            var wins = 0;
            var losses = 0;

            foreach (var game in teamGames)
            {
                var isHome = teamName.Equals(game.HomeTeam, _scoic);
                var teamPoints = isHome ? game.HomePoints : game.AwayPoints;
                var oppPoints = isHome ? game.AwayPoints : game.HomePoints;

                if (teamPoints > oppPoints)
                    wins++;
                else if (oppPoints > teamPoints)
                    losses++;
            }

            var logoUrl = team.Logos?.FirstOrDefault() ?? string.Empty;

            var teamStats = seasonStats.TryGetValue(teamName, out var stats)
                ? stats
                : [];

            teamDict[teamName] = new TeamInfo
            {
                AltColor = team.AlternateColor ?? string.Empty,
                Color = team.Color ?? string.Empty,
                Conference = team.Conference ?? string.Empty,
                Division = team.Division ?? string.Empty,
                Games = teamGames,
                LogoURL = logoUrl,
                Losses = losses,
                Name = teamName,
                TeamStats = teamStats,
                Wins = wins
            };
        }

        return teamDict;
    }

    private async Task<(IEnumerable<ApiModels.Team>? Teams, IEnumerable<ApiModels.Game>? Games, IEnumerable<ApiModels.Game>? PostseasonGames)>
        FetchRawSeasonDataAsync(int season)
    {
        var teamsTask = _client.Teams.Fbs.GetAsync(config =>
        {
            config.QueryParameters.Year = season;
        });

        var gamesTask = _client.Games.GetAsync(config =>
        {
            config.QueryParameters.Year = season;
            config.QueryParameters.SeasonTypeAsSeasonType = ApiModels.SeasonType.Regular;
        });

        var postseasonGamesTask = _client.Games.GetAsync(config =>
        {
            config.QueryParameters.Year = season;
            config.QueryParameters.SeasonTypeAsSeasonType = ApiModels.SeasonType.Postseason;
        });

        await Task.WhenAll(teamsTask, gamesTask, postseasonGamesTask);

        return (await teamsTask, await gamesTask, await postseasonGamesTask);
    }

    private async Task<IDictionary<string, IEnumerable<TeamStat>>> GetSeasonStatsAsync(
        int season,
        int week,
        IEnumerable<Game> allGames)
    {
        var hasPostseasonGames = allGames.Any(g =>
            (g.SeasonType ?? "").Equals("postseason", _scoic));
        var seasonType = hasPostseasonGames ? "postseason" : "regular";

        try
        {
            var response = await _client.Stats.Season.GetAsync(config =>
            {
                config.QueryParameters.Year = season;
                config.QueryParameters.EndWeek = seasonType.Equals("postseason", _scoic) ? null : week;
            });

            if (response is null)
                return new Dictionary<string, IEnumerable<TeamStat>>();

            return MapTeamStats(response);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch season stats for season {Season}, week {Week}, type {SeasonType}", season, week, seasonType);
            return new Dictionary<string, IEnumerable<TeamStat>>();
        }
    }

    private AdvancedGameStats MapAdvancedGameStats(ApiModels.AdvancedGameStat stat)
    {
        return new AdvancedGameStats
        {
            Defense = MapAdvancedStatsUnit(
                (int?)stat.Defense?.Drives, stat.Defense?.Explosiveness,
                stat.Defense?.LineYards, stat.Defense?.LineYardsTotal,
                stat.Defense?.OpenFieldYards, stat.Defense?.OpenFieldYardsTotal,
                stat.Defense?.PassingDowns?.Explosiveness, stat.Defense?.PassingDowns?.Ppa,
                stat.Defense?.PassingDowns?.SuccessRate, stat.Defense?.PassingPlays?.Ppa,
                (int?)stat.Defense?.Plays, stat.Defense?.PowerSuccess, stat.Defense?.Ppa,
                stat.Defense?.RushingPlays?.Ppa, stat.Defense?.SecondLevelYards,
                stat.Defense?.SecondLevelYardsTotal, stat.Defense?.StandardDowns?.Explosiveness,
                stat.Defense?.StandardDowns?.Ppa, stat.Defense?.StandardDowns?.SuccessRate,
                stat.Defense?.StuffRate, stat.Defense?.SuccessRate, stat.Defense is null),
            GameID = stat.GameId,
            Offense = MapAdvancedStatsUnit(
                (int?)stat.Offense?.Drives, stat.Offense?.Explosiveness,
                stat.Offense?.LineYards, stat.Offense?.LineYardsTotal,
                stat.Offense?.OpenFieldYards, stat.Offense?.OpenFieldYardsTotal,
                stat.Offense?.PassingDowns?.Explosiveness, stat.Offense?.PassingDowns?.Ppa,
                stat.Offense?.PassingDowns?.SuccessRate, stat.Offense?.PassingPlays?.Ppa,
                (int?)stat.Offense?.Plays, stat.Offense?.PowerSuccess, stat.Offense?.Ppa,
                stat.Offense?.RushingPlays?.Ppa, stat.Offense?.SecondLevelYards,
                stat.Offense?.SecondLevelYardsTotal, stat.Offense?.StandardDowns?.Explosiveness,
                stat.Offense?.StandardDowns?.Ppa, stat.Offense?.StandardDowns?.SuccessRate,
                stat.Offense?.StuffRate, stat.Offense?.SuccessRate, stat.Offense is null),
            Opponent = stat.Opponent,
            Team = stat.Team,
            Week = stat.Week
        };
    }

    private AdvancedGameStatsUnit? MapAdvancedStatsUnit(
        int? drives, double? explosiveness,
        double? lineYards, double? lineYardsTotal,
        double? openFieldYards, double? openFieldYardsTotal,
        double? passingDownsExplosiveness, double? passingDownsPPA,
        double? passingDownsSuccessRate, double? passingPlays,
        int? plays, double? powerSuccess, double? ppa,
        double? rushingPlays, double? secondLevelYards,
        double? secondLevelYardsTotal, double? standardDownsExplosiveness,
        double? standardDownsPPA, double? standardDownsSuccessRate,
        double? stuffRate, double? successRate, bool isNull)
    {
        if (isNull)
            return null;

        return new AdvancedGameStatsUnit
        {
            Drives = drives,
            Explosiveness = explosiveness,
            LineYards = lineYards,
            LineYardsTotal = lineYardsTotal,
            OpenFieldYards = openFieldYards,
            OpenFieldYardsTotal = openFieldYardsTotal,
            PassingDownsExplosiveness = passingDownsExplosiveness,
            PassingDownsPPA = passingDownsPPA,
            PassingDownsSuccessRate = passingDownsSuccessRate,
            PassingPlays = passingPlays,
            Plays = plays,
            PowerSuccess = powerSuccess,
            PPA = ppa,
            RushingPlays = rushingPlays,
            SecondLevelYards = secondLevelYards,
            SecondLevelYardsTotal = secondLevelYardsTotal,
            StandardDownsExplosiveness = standardDownsExplosiveness,
            StandardDownsPPA = standardDownsPPA,
            StandardDownsSuccessRate = standardDownsSuccessRate,
            StuffRate = stuffRate,
            SuccessRate = successRate
        };
    }

    private Game MapGame(ApiModels.Game g, string seasonType)
    {
        return new Game
        {
            AwayPoints = g.AwayPoints,
            AwayTeam = g.AwayTeam,
            GameID = g.Id,
            HomePoints = g.HomePoints,
            HomeTeam = g.HomeTeam,
            NeutralSite = g.NeutralSite ?? false,
            SeasonType = seasonType,
            Week = g.Week
        };
    }

    private ScheduleGame MapScheduleGame(ApiModels.Game g, string seasonType)
    {
        return new ScheduleGame
        {
            AwayPoints = g.AwayPoints,
            AwayTeam = g.AwayTeam,
            Completed = g.Completed ?? false,
            GameID = g.Id,
            HomePoints = g.HomePoints,
            HomeTeam = g.HomeTeam,
            NeutralSite = g.NeutralSite ?? false,
            SeasonType = seasonType,
            StartDate = g.StartDate?.DateTime,
            StartTimeTbd = g.StartTimeTBD ?? false,
            Venue = g.Venue,
            Week = g.Week
        };
    }

    private IDictionary<string, IEnumerable<TeamStat>> MapTeamStats(IEnumerable<ApiModels.TeamStat> stats)
    {
        if (stats is null)
            return new Dictionary<string, IEnumerable<TeamStat>>();

        return stats
            .Where(s => !string.IsNullOrEmpty(s.Team) && !string.IsNullOrEmpty(s.StatName))
            .GroupBy(s => s.Team!)
            .ToDictionary(
                g => g.Key,
                g => g.Select(s => new TeamStat
                {
                    StatName = s.StatName!,
                    StatValue = new StatValue
                    {
                        Double = s.StatValue?.Double,
                        String = s.StatValue?.String
                    }
                }),
                StringComparer.OrdinalIgnoreCase);
    }
}

public class StaticAccessTokenProvider : IAccessTokenProvider
{
    private readonly string _token;

    public StaticAccessTokenProvider(string token)
    {
        _token = token ?? throw new ArgumentNullException(nameof(token));
    }

    public Task<string> GetAuthorizationTokenAsync(Uri uri, Dictionary<string, object>? additionalAuthenticationContext = null, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_token);
    }

    public AllowedHostsValidator AllowedHostsValidator { get; } = new AllowedHostsValidator();
}
