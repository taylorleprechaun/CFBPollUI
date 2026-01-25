using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using CollegeFootballData;
using ApiModels = CollegeFootballData.Models;
using Microsoft.Kiota.Abstractions.Authentication;
using Microsoft.Kiota.Http.HttpClientLibrary;

namespace CFBPoll.Core.Services;

public class CFBDataService : ICFBDataService
{
    private readonly ApiClient _client;
    private readonly int _minimumYear;
    private readonly StringComparison _scoic = StringComparison.OrdinalIgnoreCase;

    public CFBDataService(string apiKey, int minimumYear = 2002)
    {
        _minimumYear = minimumYear;
        var authProvider = new BaseBearerTokenAuthenticationProvider(new StaticAccessTokenProvider(apiKey));
        var httpClient = new HttpClient();
        var requestAdapter = new HttpClientRequestAdapter(authProvider, httpClient: httpClient);
        _client = new ApiClient(requestAdapter);
    }

    public async Task<SeasonData> GetSeasonDataAsync(int season, int week)
    {
        var teamsResponse = await _client.Teams.Fbs.GetAsync(config =>
        {
            config.QueryParameters.Year = season;
        });

        var gamesResponse = await _client.Games.GetAsync(config =>
        {
            config.QueryParameters.Year = season;
            config.QueryParameters.SeasonTypeAsSeasonType = ApiModels.SeasonType.Regular;
        });

        var postseasonGames = await _client.Games.GetAsync(config =>
        {
            config.QueryParameters.Year = season;
            config.QueryParameters.SeasonTypeAsSeasonType = ApiModels.SeasonType.Postseason;
        });

        var regularGames = (gamesResponse ?? [])
            .Where(g => g.Week <= week && g.HomePoints.HasValue && g.AwayPoints.HasValue)
            .Select(g => new Game
            {
                Week = g.Week,
                HomeTeam = g.HomeTeam,
                AwayTeam = g.AwayTeam,
                HomePoints = g.HomePoints,
                AwayPoints = g.AwayPoints,
                NeutralSite = g.NeutralSite ?? false,
                SeasonType = "regular"
            });

        var maxRegularSeasonWeek = (gamesResponse ?? [])
            .Where(g => g.Week.HasValue)
            .Select(g => g.Week!.Value)
            .DefaultIfEmpty(0)
            .Max();

        var postGames = week > maxRegularSeasonWeek
            ? (postseasonGames ?? [])
                .Where(g => g.HomePoints.HasValue && g.AwayPoints.HasValue)
                .Select(g => new Game
                {
                    Week = g.Week,
                    HomeTeam = g.HomeTeam,
                    AwayTeam = g.AwayTeam,
                    HomePoints = g.HomePoints,
                    AwayPoints = g.AwayPoints,
                    NeutralSite = g.NeutralSite ?? false,
                    SeasonType = "postseason"
                })
            : Enumerable.Empty<Game>();

        var allGames = regularGames.Concat(postGames).ToList();

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

            teamDict[teamName] = new TeamInfo
            {
                Name = teamName,
                Conference = team.Conference ?? string.Empty,
                Division = team.Division ?? string.Empty,
                LogoURL = logoUrl,
                Wins = wins,
                Losses = losses,
                Games = teamGames
            };
        }

        return new SeasonData
        {
            Season = season,
            Week = week,
            Teams = teamDict,
            Games = allGames
        };
    }

    public async Task<IEnumerable<CalendarWeek>> GetCalendarAsync(int year)
    {
        var calendarResponse = await _client.Calendar.GetAsync(config =>
        {
            config.QueryParameters.Year = year;
        });

        if (calendarResponse == null)
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
                .Select(w => w.StartDate?.DateTime ?? DateTime.MaxValue)
                .Min();
            var maxEnd = postseasonWeeks
                .Select(w => w.EndDate?.DateTime ?? DateTime.MinValue)
                .Max();

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

    public async Task<int> GetMaxSeasonYearAsync()
    {
        var currentYear = DateTime.Now.Year;

        for (var year = currentYear; year >= _minimumYear; year--)
        {
            var calendar = await GetCalendarAsync(year);
            var calendarList = calendar.ToList();

            if (!calendarList.Any())
                continue;

            var allFuture = calendarList.All(w => w.EndDate > DateTime.Now);
            if (!allFuture)
                return year;
        }

        return _minimumYear;
    }

    public async Task<IEnumerable<Conference>> GetConferencesAsync()
    {
        var conferencesResponse = await _client.Conferences.GetAsync();

        if (conferencesResponse == null)
            return [];

        return conferencesResponse
            .Where(c => c.Classification?.ToString().Equals("fbs", _scoic) == true)
            .Select(c => new Conference
            {
                ID = c.Id ?? 0,
                Abbreviation = c.Abbreviation ?? string.Empty,
                Name = c.Name ?? string.Empty,
                ShortName = c.ShortName ?? string.Empty
            });
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
