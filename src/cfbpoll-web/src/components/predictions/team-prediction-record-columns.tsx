import { createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';

import type { TeamPredictionRecord } from '../../types';

import { TeamLogo } from '../rankings/team-logo';

const columnHelper = createColumnHelper<TeamPredictionRecord>();

export function createTeamNameColumn(season: number) {
  return columnHelper.accessor('teamName', {
    header: 'Team',
    cell: (info) => {
      const teamDetailUrl = `/team-details?team=${encodeURIComponent(info.getValue())}&season=${season}`;
      return (
        <div className="flex items-center space-x-3">
          <TeamLogo logoURL={info.row.original.logoURL} teamName={info.getValue()} />
          <Link
            to={teamDetailUrl}
            className="font-medium hover:text-accent hover:underline"
          >
            {info.getValue()}
          </Link>
        </div>
      );
    },
  });
}

export const predictedRecordColumn = columnHelper.accessor((row) => row.predictedWins, {
  id: 'predictedRecord',
  header: 'Predicted Record',
  cell: (info) => `${info.row.original.predictedWins}-${info.row.original.predictedLosses}`,
});

export const actualRecordColumn = columnHelper.accessor((row) => row.actualWins, {
  id: 'actualRecord',
  header: 'Actual Record',
  cell: (info) => `${info.row.original.actualWins}-${info.row.original.actualLosses}`,
});

export const deltaColumn = columnHelper.accessor((row) => row.actualWins - row.predictedWins, {
  id: 'delta',
  header: 'Delta',
  cell: (info) => {
    const value = info.getValue();
    return value > 0 ? `+${value}` : `${value}`;
  },
});
