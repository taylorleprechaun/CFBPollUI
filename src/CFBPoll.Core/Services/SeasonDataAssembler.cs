using CFBPoll.Core.Models;

namespace CFBPoll.Core.Services;

public static class SeasonDataAssembler
{
    private static readonly StringComparison _scoic = StringComparison.OrdinalIgnoreCase;

    public static SeasonData Assemble(
        int season,
        int week,
        IEnumerable<FBSTeam> teams,
        IEnumerable<Game> regularGames,
        IEnumerable<Game> postseasonGames,
        IEnumerable<AdvancedGameStats> regularAdvancedStats,
        IEnumerable<AdvancedGameStats> postseasonAdvancedStats,
        IDictionary<string, IEnumerable<TeamStat>> seasonStats)
    {
        ArgumentNullException.ThrowIfNull(teams);
        ArgumentNullException.ThrowIfNull(regularGames);
        ArgumentNullException.ThrowIfNull(postseasonGames);
        ArgumentNullException.ThrowIfNull(regularAdvancedStats);
        ArgumentNullException.ThrowIfNull(postseasonAdvancedStats);
        ArgumentNullException.ThrowIfNull(seasonStats);

        var maxRegularWeek = regularGames
            .Where(g => g.Week.HasValue)
            .Select(g => g.Week!.Value)
            .DefaultIfEmpty(0)
            .Max();

        var filteredGames = FilterGamesToWeek(regularGames, postseasonGames, week, maxRegularWeek);
        var gamesWithStats = AttachAdvancedStats(filteredGames, regularAdvancedStats, postseasonAdvancedStats, week, maxRegularWeek);
        var teamDict = BuildTeamDictionary(teams, gamesWithStats, seasonStats);

        return new SeasonData
        {
            Games = gamesWithStats,
            Season = season,
            Teams = teamDict,
            Week = week
        };
    }

    public static IEnumerable<Game> AttachAdvancedStats(
        IEnumerable<Game> games,
        IEnumerable<AdvancedGameStats> regularAdvancedStats,
        IEnumerable<AdvancedGameStats> postseasonAdvancedStats,
        int week,
        int maxRegularWeek)
    {
        var includePostseason = week > maxRegularWeek;

        var advancedStatsLookup = regularAdvancedStats
            .Concat(includePostseason ? postseasonAdvancedStats : [])
            .Where(s => s.GameID.HasValue && !string.IsNullOrEmpty(s.Team))
            .ToDictionary(s => (s.Team!, s.GameID!.Value), s => s);

        List<Game> result = [];
        foreach (var game in games)
        {
            var newGame = new Game
            {
                AwayPoints = game.AwayPoints,
                AwayTeam = game.AwayTeam,
                GameID = game.GameID,
                HomePoints = game.HomePoints,
                HomeTeam = game.HomeTeam,
                NeutralSite = game.NeutralSite,
                SeasonType = game.SeasonType,
                Week = game.Week
            };

            if (newGame.GameID.HasValue)
            {
                if (advancedStatsLookup.TryGetValue((newGame.HomeTeam ?? string.Empty, newGame.GameID.Value), out var homeStats))
                {
                    newGame.HomeAdvancedStats = homeStats;
                }

                if (advancedStatsLookup.TryGetValue((newGame.AwayTeam ?? string.Empty, newGame.GameID.Value), out var awayStats))
                {
                    newGame.AwayAdvancedStats = awayStats;
                }
            }

            result.Add(newGame);
        }

        return result;
    }

    public static IDictionary<string, TeamInfo> BuildTeamDictionary(
        IEnumerable<FBSTeam> teams,
        IEnumerable<Game> games,
        IDictionary<string, IEnumerable<TeamStat>> seasonStats)
    {
        var teamDict = new Dictionary<string, TeamInfo>();

        foreach (var team in teams)
        {
            if (string.IsNullOrEmpty(team.Name))
                continue;

            var teamGames = games.Where(g =>
                team.Name.Equals(g.HomeTeam, _scoic) || team.Name.Equals(g.AwayTeam, _scoic)).ToList();

            var wins = 0;
            var losses = 0;

            foreach (var game in teamGames)
            {
                var isHome = team.Name.Equals(game.HomeTeam, _scoic);
                var teamPoints = isHome ? game.HomePoints : game.AwayPoints;
                var oppPoints = isHome ? game.AwayPoints : game.HomePoints;

                if (teamPoints > oppPoints)
                    wins++;
                else if (oppPoints > teamPoints)
                    losses++;
            }

            var teamStats = seasonStats.TryGetValue(team.Name, out var stats)
                ? stats
                : [];

            teamDict[team.Name] = new TeamInfo
            {
                AltColor = team.AltColor,
                Color = team.Color,
                Conference = team.Conference,
                Division = team.Division,
                Games = teamGames,
                LogoURL = team.LogoURL,
                Losses = losses,
                Name = team.Name,
                TeamStats = teamStats,
                Wins = wins
            };
        }

        return teamDict;
    }

    public static IEnumerable<Game> FilterGamesToWeek(
        IEnumerable<Game> regularGames,
        IEnumerable<Game> postseasonGames,
        int week,
        int maxRegularWeek)
    {
        var filtered = regularGames.Where(g => g.Week <= week);

        var includePostseason = week > maxRegularWeek;
        if (includePostseason)
        {
            filtered = filtered.Concat(postseasonGames);
        }

        return filtered.ToList();
    }
}
