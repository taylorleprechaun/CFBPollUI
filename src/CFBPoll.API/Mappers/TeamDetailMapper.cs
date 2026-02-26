using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class TeamDetailMapper
{
    private static readonly StringComparison _scoic = StringComparison.OrdinalIgnoreCase;

    public static TeamDetailResponseDTO ToResponseDTO(
        RankedTeam rankedTeam,
        TeamInfo teamInfo,
        IEnumerable<ScheduleGame> scheduleGames,
        IDictionary<string, TeamInfo> allTeams,
        IEnumerable<RankedTeam> rankings)
    {
        ArgumentNullException.ThrowIfNull(rankedTeam);
        ArgumentNullException.ThrowIfNull(teamInfo);
        ArgumentNullException.ThrowIfNull(scheduleGames);
        ArgumentNullException.ThrowIfNull(allTeams);
        ArgumentNullException.ThrowIfNull(rankings);

        var teamName = rankedTeam.TeamName;

        var rankingsLookup = rankings.ToDictionary(
            r => r.TeamName, r => r, StringComparer.OrdinalIgnoreCase);

        var teamSchedule = scheduleGames
            .Where(g => teamName.Equals(g.HomeTeam, _scoic) || teamName.Equals(g.AwayTeam, _scoic))
            .OrderBy(g => g.SeasonType == "regular" ? 0 : 1)
            .ThenBy(g => g.Week)
            .ThenBy(g => g.StartDate)
            .Select(g => MapScheduleGame(g, teamName, allTeams, rankingsLookup));

        return new TeamDetailResponseDTO
        {
            AltColor = teamInfo.AltColor,
            Color = teamInfo.Color,
            Conference = rankedTeam.Conference,
            Details = RankingsMapper.ToDTO(rankedTeam.Details),
            Division = rankedTeam.Division,
            LogoURL = rankedTeam.LogoURL,
            Rank = rankedTeam.Rank,
            Rating = rankedTeam.Rating,
            Record = $"{rankedTeam.Wins}-{rankedTeam.Losses}",
            Schedule = teamSchedule,
            SOSRanking = rankedTeam.SOSRanking,
            TeamName = rankedTeam.TeamName,
            WeightedSOS = rankedTeam.WeightedSOS
        };
    }

    private static ScheduleGameDTO MapScheduleGame(
        ScheduleGame game,
        string teamName,
        IDictionary<string, TeamInfo> allTeams,
        IDictionary<string, RankedTeam> rankingsLookup)
    {
        var isHome = teamName.Equals(game.HomeTeam, _scoic);
        var opponentName = isHome ? game.AwayTeam ?? string.Empty : game.HomeTeam ?? string.Empty;

        var teamScore = isHome ? game.HomePoints : game.AwayPoints;
        var opponentScore = isHome ? game.AwayPoints : game.HomePoints;

        bool? isWin = null;
        if (game.Completed && teamScore.HasValue && opponentScore.HasValue)
        {
            isWin = teamScore > opponentScore;
        }

        var opponentLogoURL = string.Empty;
        var opponentRecord = string.Empty;
        if (allTeams.TryGetValue(opponentName, out TeamInfo? opponentInfo))
        {
            opponentLogoURL = opponentInfo.LogoURL;
            opponentRecord = $"{opponentInfo.Wins}-{opponentInfo.Losses}";
        }

        rankingsLookup.TryGetValue(opponentName, out var opponentRanked);
        int? opponentRank = opponentRanked?.Rank;

        return new ScheduleGameDTO
        {
            GameDate = game.StartDate,
            IsHome = isHome,
            IsWin = isWin,
            NeutralSite = game.NeutralSite,
            OpponentLogoURL = opponentLogoURL,
            OpponentName = opponentName,
            OpponentRank = opponentRank,
            OpponentRecord = opponentRecord,
            OpponentScore = game.Completed ? opponentScore : null,
            SeasonType = game.SeasonType,
            StartTimeTbd = game.StartTimeTbd,
            TeamScore = game.Completed ? teamScore : null,
            Venue = game.Venue,
            Week = game.Week
        };
    }
}
