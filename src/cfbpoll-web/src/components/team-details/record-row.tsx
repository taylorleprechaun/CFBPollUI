import { useMemo, useState } from 'react';
import type { TeamRecord, ScheduleGame } from '../../types';

interface RecordRowProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  filter: (g: ScheduleGame) => boolean;
  label: string;
  record: TeamRecord;
  schedule: ScheduleGame[];
}

function hasResult(g: ScheduleGame): boolean {
  return g.isWin != null;
}

export function RecordRow({
  containerRef,
  filter,
  label,
  record,
  schedule,
}: RecordRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasGames = record.wins > 0 || record.losses > 0;
  const matchingGames = useMemo(() => schedule.filter(filter), [schedule, filter]);

  const handleClick = () => {
    if (!hasGames) return;
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand && containerRef.current?.scrollIntoView) {
      const el = containerRef.current;
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  };

  return (
    <div>
      {hasGames ? (
        <button
          type="button"
          className="flex justify-between text-sm w-full cursor-pointer"
          onClick={handleClick}
          aria-expanded={expanded}
        >
          <span className="text-gray-600">
            <span className="inline-block w-4 text-gray-400" aria-label={expanded ? 'collapse' : 'expand'}>
              {expanded ? '\u25BE' : '\u25B8'}
            </span>
            <span>{label}</span>
          </span>
          <span className="font-medium">{`${record.wins}-${record.losses}`}</span>
        </button>
      ) : (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            <span>{label}</span>
          </span>
          <span className="font-medium">-</span>
        </div>
      )}
      {expanded && matchingGames.length > 0 && (
        <div className="ml-4 mt-1 pb-3 space-y-0.5 max-w-sm">
          {matchingGames.map((g) => (
            <div
              key={`${g.week}-${g.seasonType}-${g.opponentName}`}
              className="text-sm flex items-baseline"
            >
              <span className="w-10 text-right text-gray-400 shrink-0">
                {g.opponentRank != null ? `#${g.opponentRank}` : ''}
              </span>
              <span className="ml-2 flex-1 text-gray-600 truncate">
                {g.opponentName}
              </span>
              {hasResult(g) && g.teamScore != null && g.opponentScore != null && (
                <span className={`ml-2 shrink-0 ${g.isWin ? 'text-green-600' : 'text-red-600'}`}>
                  {g.isWin ? 'W' : 'L'} {g.teamScore}-{g.opponentScore}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
