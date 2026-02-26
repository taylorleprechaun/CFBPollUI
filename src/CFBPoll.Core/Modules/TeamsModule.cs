using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Modules;

public class TeamsModule : ITeamsModule
{
    private readonly ICFBDataService _dataService;
    private readonly ILogger<TeamsModule> _logger;
    private readonly IRankingsModule _rankingsModule;
    private readonly IRatingModule _ratingModule;
    private readonly StringComparison _scoic = StringComparison.OrdinalIgnoreCase;

    public TeamsModule(
        ICFBDataService dataService,
        IRankingsModule rankingsModule,
        IRatingModule ratingModule,
        ILogger<TeamsModule> logger)
    {
        _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        _rankingsModule = rankingsModule ?? throw new ArgumentNullException(nameof(rankingsModule));
        _ratingModule = ratingModule ?? throw new ArgumentNullException(nameof(ratingModule));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<TeamDetailResult?> GetTeamDetailAsync(string teamName, int season, int week)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(teamName);

        var publishedSnapshot = await _rankingsModule.GetPublishedSnapshotAsync(season, week).ConfigureAwait(false);

        if (publishedSnapshot is not null)
        {
            return await BuildPublishedTeamDetailAsync(teamName, season, publishedSnapshot).ConfigureAwait(false);
        }

        return await BuildCalculatedTeamDetailAsync(teamName, season, week).ConfigureAwait(false);
    }

    private IDictionary<string, TeamInfo> BuildTeamsFromMetadata(
        IEnumerable<FBSTeam> fbsTeams,
        IEnumerable<RankedTeam> rankings)
    {
        var rankingsLookup = rankings.ToDictionary(
            r => r.TeamName, r => r, StringComparer.OrdinalIgnoreCase);

        var teams = new Dictionary<string, TeamInfo>(StringComparer.OrdinalIgnoreCase);

        foreach (var fbs in fbsTeams)
        {
            var teamInfo = new TeamInfo
            {
                AltColor = fbs.AltColor,
                Color = fbs.Color,
                Conference = fbs.Conference,
                Division = fbs.Division,
                LogoURL = fbs.LogoURL,
                Name = fbs.Name
            };

            if (rankingsLookup.TryGetValue(fbs.Name, out var ranked))
            {
                teamInfo.Losses = ranked.Losses;
                teamInfo.Wins = ranked.Wins;
            }

            teams[fbs.Name] = teamInfo;
        }

        return teams;
    }

    private async Task<TeamDetailResult?> BuildCalculatedTeamDetailAsync(string teamName, int season, int week)
    {
        var seasonData = await _dataService.GetSeasonDataAsync(season, week).ConfigureAwait(false);

        if (!seasonData.Teams.ContainsKey(teamName))
        {
            _logger.LogDebug("Team {TeamName} not found in season data for season {Season}, week {Week}",
                teamName, season, week);
            return null;
        }

        var fullScheduleTask = _dataService.GetFullSeasonScheduleAsync(season);

        var ratings = await _ratingModule.RateTeamsAsync(seasonData).ConfigureAwait(false);
        var rankingsResult = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings).ConfigureAwait(false);

        var rankedTeam = rankingsResult.Rankings.FirstOrDefault(
            r => r.TeamName.Equals(teamName, _scoic));

        if (rankedTeam is null)
        {
            _logger.LogDebug("Team {TeamName} not found in rankings for season {Season}, week {Week}",
                teamName, season, week);
            return null;
        }

        var fullSchedule = await fullScheduleTask.ConfigureAwait(false);

        return new TeamDetailResult
        {
            AllRankings = rankingsResult.Rankings,
            FullSchedule = fullSchedule,
            RankedTeam = rankedTeam,
            Teams = seasonData.Teams
        };
    }

    private async Task<TeamDetailResult?> BuildPublishedTeamDetailAsync(
        string teamName,
        int season,
        RankingsResult publishedSnapshot)
    {
        var rankedTeam = publishedSnapshot.Rankings.FirstOrDefault(
            r => r.TeamName.Equals(teamName, _scoic));

        if (rankedTeam is null)
        {
            _logger.LogDebug("Team {TeamName} not found in published rankings for season {Season}, week {Week}",
                teamName, season, publishedSnapshot.Week);
            return null;
        }

        var fbsTeamsTask = _dataService.GetFBSTeamsAsync(season);
        var fullScheduleTask = _dataService.GetFullSeasonScheduleAsync(season);

        await Task.WhenAll(fbsTeamsTask, fullScheduleTask).ConfigureAwait(false);

        var teams = BuildTeamsFromMetadata(fbsTeamsTask.Result, publishedSnapshot.Rankings);

        return new TeamDetailResult
        {
            AllRankings = publishedSnapshot.Rankings,
            FullSchedule = fullScheduleTask.Result,
            RankedTeam = rankedTeam,
            Teams = teams
        };
    }
}
