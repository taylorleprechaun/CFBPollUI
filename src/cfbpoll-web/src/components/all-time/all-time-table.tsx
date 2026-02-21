import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { AllTimeEntry } from '../../types';
import { SortableTable } from '../ui/sortable-table';
import { TeamLogo } from '../rankings/team-logo';

interface AllTimeTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<AllTimeEntry, any>[];
  entries: AllTimeEntry[];
  isLoading: boolean;
}

export const columnHelper = createColumnHelper<AllTimeEntry>();

export const allTimeRankColumn = columnHelper.accessor('allTimeRank', {
  header: '#',
  cell: (info) => info.getValue(),
});

export const teamNameColumn = columnHelper.accessor('teamName', {
  header: 'Team',
  cell: (info) => {
    const entry = info.row.original;
    const teamDetailUrl = `/team-details?team=${encodeURIComponent(info.getValue())}&season=${entry.season}&week=${entry.week}`;
    return (
      <div className="flex items-center space-x-3">
        <TeamLogo logoURL={entry.logoURL} teamName={info.getValue()} />
        <Link
          to={teamDetailUrl}
          className="font-medium hover:text-blue-600 hover:underline"
        >
          {info.getValue()}
        </Link>
      </div>
    );
  },
});

export const seasonColumn = columnHelper.accessor('season', {
  header: 'Season',
  cell: (info) => info.getValue(),
});

export const recordColumn = columnHelper.accessor('record', {
  header: 'Record',
  cell: (info) => info.getValue(),
});

export const rankColumn = columnHelper.accessor('rank', {
  header: 'Final Rank',
  cell: (info) => info.getValue(),
});

export const ratingColumn = columnHelper.accessor('rating', {
  header: 'Rating',
  cell: (info) => info.getValue().toFixed(4),
});

export const weightedSOSColumn = columnHelper.accessor('weightedSOS', {
  header: 'Weighted SOS',
  cell: (info) => info.getValue().toFixed(4),
});

export function AllTimeTable({ columns, entries, isLoading }: AllTimeTableProps) {
  return (
    <SortableTable
      columns={columns}
      data={entries}
      isLoading={isLoading}
    />
  );
}
