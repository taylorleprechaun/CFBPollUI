import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { TableSkeleton } from '../../../components/ui/table-skeleton';

describe('TableSkeleton', () => {
  it('renders a table structure', () => {
    render(<TableSkeleton columns={3} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders correct number of header columns', () => {
    render(<TableSkeleton columns={4} />);

    const headerCells = screen.getAllByRole('columnheader');
    expect(headerCells).toHaveLength(4);
  });

  it('renders default 10 body rows', () => {
    render(<TableSkeleton columns={3} />);

    const rows = screen.getAllByRole('row');
    // 1 header row + 10 body rows
    expect(rows).toHaveLength(11);
  });

  it('renders custom number of body rows', () => {
    render(<TableSkeleton columns={2} rows={5} />);

    const rows = screen.getAllByRole('row');
    // 1 header row + 5 body rows
    expect(rows).toHaveLength(6);
  });

  it('renders skeleton placeholders with animate-pulse', () => {
    const { container } = render(<TableSkeleton columns={3} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('applies alternating row backgrounds', () => {
    render(<TableSkeleton columns={2} rows={4} />);

    const rows = screen.getAllByRole('row');
    const bodyRows = rows.slice(1);
    expect(bodyRows[1]).toHaveClass('bg-surface-alt/50');
    expect(bodyRows[3]).toHaveClass('bg-surface-alt/50');
    expect(bodyRows[0]).not.toHaveClass('bg-surface-alt/50');
  });
});
