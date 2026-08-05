import { Link } from 'react-router-dom';

interface TeamNameLabelProps {
  className?: string;
  rank?: number;
  season?: number | null;
  teamName: string;
}

export function TeamNameLabel({ className, rank, season, teamName }: TeamNameLabelProps) {
  const showRank = rank != null && rank >= 1 && rank <= 25;
  const label = (
    <>
      {showRank && <span className="text-xs">#{rank} </span>}
      {teamName}
    </>
  );

  if (season == null) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link
      to={`/team-details?team=${encodeURIComponent(teamName)}&season=${season}`}
      className={className ?? 'hover:text-accent hover:underline'}
    >
      {label}
    </Link>
  );
}
