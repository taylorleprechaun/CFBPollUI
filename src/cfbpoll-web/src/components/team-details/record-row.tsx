import { useMemo, useState } from 'react';
import { ChevronIcon } from '../ui/chevron-icon';
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
          className="flex justify-between text-sm w-full cursor-pointer transition-colors duration-150 hover:bg-surface-alt rounded-md px-1 -mx-1"
          onClick={handleClick}
          aria-expanded={expanded}
        >
          <span className="text-text-secondary flex items-center">
            <span className="inline-block w-4" aria-label={expanded ? 'collapse' : 'expand'}>
              <ChevronIcon open={expanded} size="w-3 h-3" />
            </span>
            <span>{label}</span>
          </span>
          <span className="font-medium">{`${record.wins}-${record.losses}`}</span>
        </button>
      ) : (
        <div className="flex justify-between text-sm px-1 -mx-1">
          <span className="text-text-secondary">
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
              <span className="w-10 text-right text-text-muted shrink-0">
                {g.opponentRank != null ? `#${g.opponentRank}` : ''}
              </span>
              <span className="ml-2 flex-1 text-text-secondary truncate">
                {g.opponentName}
              </span>
              {hasResult(g) && g.teamScore != null && g.opponentScore != null && (
                <span className={`ml-2 shrink-0 ${g.isWin ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
