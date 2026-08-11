import { useMemo } from 'react';

import type { TeamPredictionRecord } from '../../types';

import { EmptyState } from '../ui/empty-state';
import { SortableTable } from '../ui/sortable-table';
import { TableSkeleton } from '../ui/table-skeleton';
import { TeamPredictionRecordCard } from './team-prediction-record-card';
import {
  actualRecordColumn,
  createTeamNameColumn,
  deltaColumn,
  predictedRecordColumn,
} from './team-prediction-record-columns';

const COLUMN_COUNT = 4;

interface TeamPredictionRecordsTableProps {
  emptyMessage: string;
  isLoading: boolean;
  records: TeamPredictionRecord[];
  season: number;
}

export function TeamPredictionRecordsTable({ emptyMessage, isLoading, records, season }: TeamPredictionRecordsTableProps) {
  const columns = useMemo(
    () => [createTeamNameColumn(season), predictedRecordColumn, actualRecordColumn, deltaColumn],
    [season]
  );

  if (isLoading) {
    return <TableSkeleton columns={COLUMN_COUNT} />;
  }

  if (records.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <>
      <div className="hidden md:block">
        <SortableTable columns={columns} data={records} isLoading={false} />
      </div>

      <div className="md:hidden space-y-3 p-3">
        {records.map((record) => (
          <TeamPredictionRecordCard key={record.teamName} record={record} season={season} />
        ))}
      </div>
    </>
  );
}
