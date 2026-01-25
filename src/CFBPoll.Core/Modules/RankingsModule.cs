using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

public class RankingsModule : IRankingsModule
{
    private readonly StringComparison _scoic = StringComparison.OrdinalIgnoreCase;

    public RankingsResult GenerateRankings(SeasonData seasonData, IDictionary<string, RatingDetails> ratings)
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

        return new RankingsResult
        {
            Season = seasonData.Season,
            Week = seasonData.Week,
            Rankings = rankedTeams
        };
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

    private static int GetOpponentTier(string opponentName, IDictionary<string, int> teamRankLookup)
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

    private static TeamDetails UpdateLocationRecord(TeamDetails details, bool neutralSite, bool isHome, bool isWin)
    {
        if (neutralSite)
        {
            return new TeamDetails
            {
                Away = details.Away,
                Home = details.Home,
                Neutral = isWin ? details.Neutral.AddWin() : details.Neutral.AddLoss(),
                VsRank101Plus = details.VsRank101Plus,
                VsRank11To25 = details.VsRank11To25,
                VsRank1To10 = details.VsRank1To10,
                VsRank26To50 = details.VsRank26To50,
                VsRank51To100 = details.VsRank51To100
            };
        }

        if (isHome)
        {
            return new TeamDetails
            {
                Away = details.Away,
                Home = isWin ? details.Home.AddWin() : details.Home.AddLoss(),
                Neutral = details.Neutral,
                VsRank101Plus = details.VsRank101Plus,
                VsRank11To25 = details.VsRank11To25,
                VsRank1To10 = details.VsRank1To10,
                VsRank26To50 = details.VsRank26To50,
                VsRank51To100 = details.VsRank51To100
            };
        }

        return new TeamDetails
        {
            Away = isWin ? details.Away.AddWin() : details.Away.AddLoss(),
            Home = details.Home,
            Neutral = details.Neutral,
            VsRank101Plus = details.VsRank101Plus,
            VsRank11To25 = details.VsRank11To25,
            VsRank1To10 = details.VsRank1To10,
            VsRank26To50 = details.VsRank26To50,
            VsRank51To100 = details.VsRank51To100
        };
    }

    private static TeamDetails UpdateOpponentTierRecord(
        TeamDetails details,
        string opponentName,
        IDictionary<string, int> teamRankLookup,
        bool isWin)
    {
        var tier = GetOpponentTier(opponentName, teamRankLookup);

        return tier switch
        {
            1 => new TeamDetails
            {
                Away = details.Away,
                Home = details.Home,
                Neutral = details.Neutral,
                VsRank101Plus = details.VsRank101Plus,
                VsRank11To25 = details.VsRank11To25,
                VsRank1To10 = isWin ? details.VsRank1To10.AddWin() : details.VsRank1To10.AddLoss(),
                VsRank26To50 = details.VsRank26To50,
                VsRank51To100 = details.VsRank51To100
            },
            2 => new TeamDetails
            {
                Away = details.Away,
                Home = details.Home,
                Neutral = details.Neutral,
                VsRank101Plus = details.VsRank101Plus,
                VsRank11To25 = isWin ? details.VsRank11To25.AddWin() : details.VsRank11To25.AddLoss(),
                VsRank1To10 = details.VsRank1To10,
                VsRank26To50 = details.VsRank26To50,
                VsRank51To100 = details.VsRank51To100
            },
            3 => new TeamDetails
            {
                Away = details.Away,
                Home = details.Home,
                Neutral = details.Neutral,
                VsRank101Plus = details.VsRank101Plus,
                VsRank11To25 = details.VsRank11To25,
                VsRank1To10 = details.VsRank1To10,
                VsRank26To50 = isWin ? details.VsRank26To50.AddWin() : details.VsRank26To50.AddLoss(),
                VsRank51To100 = details.VsRank51To100
            },
            4 => new TeamDetails
            {
                Away = details.Away,
                Home = details.Home,
                Neutral = details.Neutral,
                VsRank101Plus = details.VsRank101Plus,
                VsRank11To25 = details.VsRank11To25,
                VsRank1To10 = details.VsRank1To10,
                VsRank26To50 = details.VsRank26To50,
                VsRank51To100 = isWin ? details.VsRank51To100.AddWin() : details.VsRank51To100.AddLoss()
            },
            _ => new TeamDetails
            {
                Away = details.Away,
                Home = details.Home,
                Neutral = details.Neutral,
                VsRank101Plus = isWin ? details.VsRank101Plus.AddWin() : details.VsRank101Plus.AddLoss(),
                VsRank11To25 = details.VsRank11To25,
                VsRank1To10 = details.VsRank1To10,
                VsRank26To50 = details.VsRank26To50,
                VsRank51To100 = details.VsRank51To100
            }
        };
    }
}
