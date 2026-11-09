import type { MatchupActualGame } from '../../schemas/admin';

import { formatOverUnder, formatSpread } from '../../lib/prediction-format-utils';

interface MatchupSeasonMeetingsProps {
  games: MatchupActualGame[];
}

export function MatchupSeasonMeetings({ games }: MatchupSeasonMeetingsProps) {
  if (games.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Season Meetings</h3>
      <ul className="bg-surface border border-border rounded-xl divide-y divide-border">
        {games.map((game) => (
          <li
            key={`${game.seasonType}-${game.week ?? 'na'}-${game.homeTeam}-${game.awayTeam}`}
            className={`px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm ${
              game.playedAfterPrediction ? 'opacity-60' : ''
            }`}
          >
            <span className="font-medium text-text-primary">
              {game.seasonType === 'postseason' ? 'Postseason' : `Week ${game.week}`}
              {game.playedAfterPrediction && (
                <span className="ml-2 text-xs font-normal text-text-muted">(after prediction)</span>
              )}
            </span>
            <span className="text-text-secondary">
              {game.awayTeam} {game.awayPoints} {game.neutralSite ? 'vs' : 'at'} {game.homeTeam} {game.homePoints}
            </span>
            <span className="text-text-muted">
              Spread: {formatSpread(game)} · O/U: {formatOverUnder(game.bettingOverUnder)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
