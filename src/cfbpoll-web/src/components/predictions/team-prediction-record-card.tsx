import { Link } from 'react-router-dom';

import type { TeamPredictionRecord } from '../../types';

import { deltaClasses } from '../../lib/delta-classes';
import { TeamLogo } from '../rankings/team-logo';
import { ValueBadge } from '../ui/value-badge';
import { FactRow } from './prediction-card';

interface TeamPredictionRecordCardProps {
  record: TeamPredictionRecord;
  season: number;
}

export function TeamPredictionRecordCard({ record, season }: TeamPredictionRecordCardProps) {
  const teamDetailUrl = `/team-details?team=${encodeURIComponent(record.teamName)}&season=${season}`;
  const delta = record.actualWins - record.predictedWins;
  const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <div className="bg-surface border border-border rounded-xl divide-y divide-border">
      <div className="px-4 py-2 flex items-center space-x-3">
        <TeamLogo logoURL={record.logoURL} teamName={record.teamName} />
        <Link to={teamDetailUrl} className="font-medium hover:text-accent hover:underline">
          {record.teamName}
        </Link>
      </div>

      <FactRow label="Predicted Record" value={`${record.predictedWins}-${record.predictedLosses}`} />

      <FactRow label="Actual Record" value={`${record.actualWins}-${record.actualLosses}`} />

      <FactRow
        label="Delta"
        value={<ValueBadge classes={deltaClasses(delta)} value={deltaLabel} />}
      />
    </div>
  );
}
