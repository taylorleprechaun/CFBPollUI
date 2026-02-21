import { Link } from 'react-router-dom';
import { TeamLogo } from '../rankings/team-logo';
import type { ScheduleGame } from '../../types';

interface ScheduleRowProps {
  fbsTeamNames: Set<string>;
  game: ScheduleGame;
  onTeamClick: (teamName: string) => void;
  selectedSeason: number | null;
  selectedWeek: number | null;
}

export function ScheduleRow({
  fbsTeamNames,
  game,
  onTeamClick,
  selectedSeason,
  selectedWeek,
}: ScheduleRowProps) {
  const gameDate = game.gameDate ? new Date(game.gameDate) : null;
  const dateStr = gameDate
    ? gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'TBD';
  const timeStr = game.startTimeTbd
    ? 'TBA'
    : gameDate
      ? gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';

  const locationPrefix = game.neutralSite
    ? 'vs '
    : game.isHome
      ? ''
      : 'at ';

  const weekLabel = game.seasonType === 'postseason' ? 'Post' : `${game.week ?? ''}`;

  const showRank = game.opponentRank != null && game.opponentRank >= 1 && game.opponentRank <= 25;

  const isFbs = fbsTeamNames.has(game.opponentName);
  const teamDetailUrl = `/team-details?team=${encodeURIComponent(game.opponentName)}${selectedSeason != null ? `&season=${selectedSeason}` : ''}${selectedWeek != null ? `&week=${selectedWeek}` : ''}`;

  const opponentLabel = (
    <span className="text-gray-900">
      {locationPrefix}
      {showRank && <span className="text-xs">#{game.opponentRank} </span>}
      {game.opponentName}
    </span>
  );

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
        {weekLabel}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm">
        <div className="text-gray-900">{dateStr}</div>
        {timeStr && <div className="text-gray-400 text-xs">{timeStr}</div>}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm">
        <div className="flex items-center space-x-2">
          <TeamLogo logoURL={game.opponentLogoURL} teamName={game.opponentName} />
          <div>
            {isFbs ? (
              <Link
                to={teamDetailUrl}
                className="hover:text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  onTeamClick(game.opponentName);
                }}
              >
                {opponentLabel}
              </Link>
            ) : (
              opponentLabel
            )}
            {game.opponentRecord && (
              <span className="text-gray-400 ml-1">({game.opponentRecord})</span>
            )}
            {game.venue && (
              <div className="text-gray-400 text-xs">{game.venue}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm">
        {game.isWin != null && game.teamScore != null && game.opponentScore != null ? (
          <span className={game.isWin ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {game.isWin ? 'W' : 'L'} {game.teamScore}-{game.opponentScore}
          </span>
        ) : null}
      </td>
    </tr>
  );
}
