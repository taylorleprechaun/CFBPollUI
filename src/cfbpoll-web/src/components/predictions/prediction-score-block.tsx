import { useState } from 'react';

import type { GamePredictionPublic } from '../../schemas';

import { TeamLogo } from '../rankings/team-logo';
import { InfoIcon } from '../ui/icons';
import { OfficialScoreModal } from './official-score-modal';
import { TeamNameLabel } from './team-name-label';

interface PredictionScoreBlockProps {
  prediction: GamePredictionPublic;
  rankByTeam?: Map<string, number>;
  season?: number | null;
  showGrades?: boolean;
  showPredictedScore?: boolean;
}

export function PredictionScoreBlock({ prediction: p, rankByTeam, season = null, showGrades = false, showPredictedScore = true }: PredictionScoreBlockProps) {
  const [isOfficialScoreModalOpen, setIsOfficialScoreModalOpen] = useState(false);
  const isFinal = showGrades && p.actualAwayScore !== null && p.actualHomeScore !== null;
  const awayScore = showPredictedScore ? p.awayTeamScore : isFinal ? p.actualAwayScore : null;
  const homeScore = showPredictedScore ? p.homeTeamScore : isFinal ? p.actualHomeScore : null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <TeamLogo logoURL={p.awayLogoURL} teamName={p.awayTeam} />
        <TeamNameLabel teamName={p.awayTeam} season={season} rank={rankByTeam?.get(p.awayTeam.toLowerCase())} />
        {awayScore !== null && <span className="font-semibold ml-auto">{awayScore}</span>}
      </div>
      <div className="flex items-center gap-2">
        <TeamLogo logoURL={p.homeLogoURL} teamName={p.homeTeam} />
        <TeamNameLabel teamName={p.homeTeam} season={season} rank={rankByTeam?.get(p.homeTeam.toLowerCase())} />
        {p.neutralSite && <span className="text-text-muted text-xs">(N)</span>}
        {homeScore !== null && <span className="font-semibold ml-auto">{homeScore}</span>}
      </div>
      {showPredictedScore && isFinal && (
        <span className="text-sm font-semibold text-text-primary">
          Final: {p.actualAwayScore}-{p.actualHomeScore}
        </span>
      )}
      {isFinal && p.scoreOverrideReason && (
        <>
          <button
            type="button"
            onClick={() => setIsOfficialScoreModalOpen(true)}
            className="inline-flex items-center gap-1 self-start text-xs text-amber-600 hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 rounded"
          >
            Official score
            <InfoIcon />
          </button>
          {isOfficialScoreModalOpen && (
            <OfficialScoreModal onClose={() => setIsOfficialScoreModalOpen(false)} prediction={p} />
          )}
        </>
      )}
    </div>
  );
}
