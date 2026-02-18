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
        var seasonData = await _dataService.GetSeasonDataAsync(season, week).ConfigureAwait(false);

        if (!seasonData.Teams.ContainsKey(teamName))
        {
            _logger.LogDebug("Team {TeamName} not found in season data for season {Season}, week {Week}",
                teamName, season, week);
            return null;
        }

        var rankingsResult = await _rankingsModule.GetPublishedSnapshotAsync(season, week).ConfigureAwait(false);

        if (rankingsResult is null)
        {
            var ratings = _ratingModule.RateTeams(seasonData);
            rankingsResult = await _rankingsModule.GenerateRankingsAsync(seasonData, ratings).ConfigureAwait(false);
        }

        var rankedTeam = rankingsResult.Rankings.FirstOrDefault(
            r => r.TeamName.Equals(teamName, StringComparison.OrdinalIgnoreCase));

        if (rankedTeam is null)
        {
            _logger.LogDebug("Team {TeamName} not found in rankings for season {Season}, week {Week}",
                teamName, season, week);
            return null;
        }

        var fullSchedule = await _dataService.GetFullSeasonScheduleAsync(season).ConfigureAwait(false);

        return new TeamDetailResult
        {
            AllRankings = rankingsResult.Rankings,
            FullSchedule = fullSchedule,
            RankedTeam = rankedTeam,
            Teams = seasonData.Teams
        };
    }
}
