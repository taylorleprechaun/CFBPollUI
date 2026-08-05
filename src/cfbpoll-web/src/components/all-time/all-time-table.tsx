import type { ColumnDef } from '@tanstack/react-table';
import type { AllTimeEntry } from '../../types';
import { SortableTable } from '../ui/sortable-table';

interface AllTimeTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<AllTimeEntry, any>[];
  entries: AllTimeEntry[];
  isLoading: boolean;
}

export function AllTimeTable({ columns, entries, isLoading }: AllTimeTableProps) {
  return (
    <SortableTable
      columns={columns}
      data={entries}
      isLoading={isLoading}
    />
  );
}
