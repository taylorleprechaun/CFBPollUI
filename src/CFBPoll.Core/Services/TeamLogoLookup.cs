using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;

namespace CFBPoll.Core.Services;

/// <summary>
/// Builds a team-name-to-logo-URL lookup for enriching admin/rankings display data with team logos.
/// A plain static helper (not a DI-registered module) so callers can pass in whichever
/// <see cref="ICFBDataService"/> instance they already hold - <see cref="GameOverrideModule"/>
/// itself cannot depend on <see cref="ICFBDataService"/> directly, since the caching decorator that
/// implements it already depends on <see cref="Modules.GameOverrideModule"/> to apply overrides to
/// fetched schedules, and a constructor dependency the other way would create a circular resolution.
/// </summary>
public static class TeamLogoLookup
{
    public static async Task<IReadOnlyDictionary<string, string>> GetTeamLogosByNameAsync(ICFBDataService dataService, int season)
    {
        var teams = await dataService.GetFBSTeamsAsync(season).ConfigureAwait(false);

        return teams
            .GroupBy(t => t.Name, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First().LogoURL, StringComparer.OrdinalIgnoreCase);
    }

    public static GameOverride WithTeamLogos(GameOverride gameOverride, IReadOnlyDictionary<string, string> teamLogosByName)
    {
        return new GameOverride
        {
            AwayTeam = gameOverride.AwayTeam,
            AwayTeamLogoURL = teamLogosByName.GetValueOrDefault(gameOverride.AwayTeam),
            CreatedAt = gameOverride.CreatedAt,
            GameID = gameOverride.GameID,
            HomeTeam = gameOverride.HomeTeam,
            HomeTeamLogoURL = teamLogosByName.GetValueOrDefault(gameOverride.HomeTeam),
            ModifiedAt = gameOverride.ModifiedAt,
            OriginalAwayPoints = gameOverride.OriginalAwayPoints,
            OriginalHomePoints = gameOverride.OriginalHomePoints,
            OverrideAwayPoints = gameOverride.OverrideAwayPoints,
            OverrideHomePoints = gameOverride.OverrideHomePoints,
            Reason = gameOverride.Reason,
            Season = gameOverride.Season,
            SeasonType = gameOverride.SeasonType,
            Week = gameOverride.Week
        };
    }

    public static ScheduleGame WithTeamLogos(ScheduleGame scheduleGame, IReadOnlyDictionary<string, string> teamLogosByName)
    {
        return new ScheduleGame
        {
            AwayPoints = scheduleGame.AwayPoints,
            AwayTeam = scheduleGame.AwayTeam,
            AwayTeamLogoURL = scheduleGame.AwayTeam is not null ? teamLogosByName.GetValueOrDefault(scheduleGame.AwayTeam) : null,
            Completed = scheduleGame.Completed,
            GameID = scheduleGame.GameID,
            HomePoints = scheduleGame.HomePoints,
            HomeTeam = scheduleGame.HomeTeam,
            HomeTeamLogoURL = scheduleGame.HomeTeam is not null ? teamLogosByName.GetValueOrDefault(scheduleGame.HomeTeam) : null,
            NeutralSite = scheduleGame.NeutralSite,
            OriginalAwayPoints = scheduleGame.OriginalAwayPoints,
            OriginalHomePoints = scheduleGame.OriginalHomePoints,
            ScoreOverrideReason = scheduleGame.ScoreOverrideReason,
            SeasonType = scheduleGame.SeasonType,
            StartDate = scheduleGame.StartDate,
            StartTimeTbd = scheduleGame.StartTimeTbd,
            Venue = scheduleGame.Venue,
            Week = scheduleGame.Week
        };
    }
}
