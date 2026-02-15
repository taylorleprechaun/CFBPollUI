using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

public class RankingsModule : IRankingsModule
{
    private readonly StringComparison _scoic = StringComparison.OrdinalIgnoreCase;

    public Task<RankingsResult> GenerateRankingsAsync(SeasonData seasonData, IDictionary<string, RatingDetails> ratings)
    {
        var sortedTeams = ratings
            .OrderByDescending(kvp => kvp.Value.Rating);

        var sosRankings = ratings
            .OrderByDescending(kvp => kvp.Value.WeightedStrengthOfSchedule)
            .Select((kvp, index) => new { TeamName = kvp.Key, Rank = index + 1 })
            .ToDictionary(x => x.TeamName, x => x.Rank);

        var teamRankLookup = sortedTeams
            .Select((kvp, index) => new { TeamName = kvp.Key, Rank = index + 1 })
            .ToDictionary(x => x.TeamName, x => x.Rank, StringComparer.OrdinalIgnoreCase);

        var rankedTeams = new List<RankedTeam>();
        var rank = 1;

        foreach (var kvp in sortedTeams)
        {
            var teamName = kvp.Key;
            var ratingDetails = kvp.Value;
            var teamInfo = seasonData.Teams.TryGetValue(teamName, out var info)
                ? info
                : null;

            var details = CalculateTeamDetails(teamName, teamInfo?.Games ?? [], teamRankLookup);

            rankedTeams.Add(new RankedTeam
            {
                Conference = teamInfo?.Conference ?? string.Empty,
                Details = details,
                Division = teamInfo?.Division ?? string.Empty,
                LogoURL = teamInfo?.LogoURL ?? string.Empty,
                Losses = ratingDetails.Losses,
                Rank = rank,
                Rating = Math.Round(ratingDetails.Rating, 4),
                SOSRanking = sosRankings.TryGetValue(teamName, out var sosRank) ? sosRank : 0,
                TeamName = teamName,
                WeightedSOS = Math.Round(ratingDetails.WeightedStrengthOfSchedule, 4),
                Wins = ratingDetails.Wins
            });

            rank++;
        }

        return Task.FromResult(new RankingsResult
        {
            Season = seasonData.Season,
            Week = seasonData.Week,
            Rankings = rankedTeams
        });
    }

    private TeamDetails CalculateTeamDetails(
        string teamName,
        IEnumerable<Game> games,
        IDictionary<string, int> teamRankLookup)
    {
        var details = new TeamDetails();

        foreach (var game in games)
        {
            var isHome = teamName.Equals(game.HomeTeam, _scoic);
            var teamPoints = isHome ? game.HomePoints : game.AwayPoints;
            var oppPoints = isHome ? game.AwayPoints : game.HomePoints;
            var opponentName = isHome ? game.AwayTeam : game.HomeTeam;

            if (!teamPoints.HasValue || !oppPoints.HasValue)
                continue;

            var isWin = teamPoints > oppPoints;

            details = UpdateLocationRecord(details, game.NeutralSite, isHome, isWin);
            details = UpdateOpponentTierRecord(details, opponentName ?? "", teamRankLookup, isWin);
        }

        return details;
    }

    private int GetOpponentTier(string opponentName, IDictionary<string, int> teamRankLookup)
    {
        if (!teamRankLookup.TryGetValue(opponentName, out var opponentRank))
            return 5;

        return opponentRank switch
        {
            <= 10 => 1,
            <= 25 => 2,
            <= 50 => 3,
            <= 100 => 4,
            _ => 5
        };
    }

    private Record UpdateRecord(Record record, bool isWin)
    {
        return isWin ? record.AddWin() : record.AddLoss();
    }

    private TeamDetails UpdateLocationRecord(TeamDetails details, bool neutralSite, bool isHome, bool isWin)
    {
        if (neutralSite)
            return details with { Neutral = UpdateRecord(details.Neutral, isWin) };

        if (isHome)
            return details with { Home = UpdateRecord(details.Home, isWin) };

        return details with { Away = UpdateRecord(details.Away, isWin) };
    }

    private TeamDetails UpdateOpponentTierRecord(
        TeamDetails details,
        string opponentName,
        IDictionary<string, int> teamRankLookup,
        bool isWin)
    {
        var tier = GetOpponentTier(opponentName, teamRankLookup);

        return tier switch
        {
            1 => details with { VsRank1To10 = UpdateRecord(details.VsRank1To10, isWin) },
            2 => details with { VsRank11To25 = UpdateRecord(details.VsRank11To25, isWin) },
            3 => details with { VsRank26To50 = UpdateRecord(details.VsRank26To50, isWin) },
            4 => details with { VsRank51To100 = UpdateRecord(details.VsRank51To100, isWin) },
            _ => details with { VsRank101Plus = UpdateRecord(details.VsRank101Plus, isWin) }
        };
    }
}
