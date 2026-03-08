import { Skeleton } from './skeleton';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export function TableSkeleton({ columns, rows = 10 }: TableSkeletonProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-surface-alt border-b-2 border-border">
          <tr>
            {Array.from({ length: columns }, (_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-surface-alt/50' : ''}>
              {Array.from({ length: columns }, (_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <Skeleton className={`h-4 ${colIndex === 0 ? 'w-8' : 'w-20'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
