import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';

import { SortAscIcon, SortDescIcon, SortNeutralIcon } from './icons';
import { EmptyState } from './empty-state';
import { TableSkeleton } from './table-skeleton';

interface SortableTableProps<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  data: T[];
  emptyMessage?: string;
  isLoading: boolean;
}

export function SortableTable<T>({
  columns,
  data,
  emptyMessage = 'No data available.',
  isLoading,
}: SortableTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return <TableSkeleton columns={columns.length} />;
  }

  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-surface-alt border-b-2 border-border">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortDirection = header.column.getIsSorted();
                const headerText = typeof header.column.columnDef.header === 'string'
                  ? header.column.columnDef.header
                  : header.id;

                return (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    aria-sort={
                      sortDirection === 'asc' ? 'ascending'
                        : sortDirection === 'desc' ? 'descending'
                          : 'none'
                    }
                    aria-label={`Sort by ${headerText}`}
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-surface-elevated select-none ${
                      sortDirection ? 'text-accent' : 'text-text-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      <span className="transition-transform duration-200">
                        {sortDirection === 'asc'
                          ? <SortAscIcon />
                          : sortDirection === 'desc'
                            ? <SortDescIcon />
                            : <SortNeutralIcon />}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="bg-surface divide-y divide-border">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="even:bg-surface-alt/50 hover:bg-accent-light/50 transition-colors duration-150">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
