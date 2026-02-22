import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createColumnHelper } from '@tanstack/react-table';

import { SortableTable } from '../../../components/ui/sortable-table';

interface TestRow {
  id: number;
  name: string;
  score: number;
}

const columnHelper = createColumnHelper<TestRow>();

const stringHeaderColumns = [
  columnHelper.accessor('id', { header: 'ID' }),
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('score', { header: 'Score' }),
];

const renderHeaderColumns = [
  columnHelper.accessor('id', { header: 'ID' }),
  columnHelper.accessor('name', {
    header: () => <span data-testid="custom-header">Custom Name</span>,
  }),
  columnHelper.accessor('score', { header: 'Score' }),
];

const testData: TestRow[] = [
  { id: 1, name: 'Alabama', score: 95 },
  { id: 2, name: 'Ohio State', score: 88 },
  { id: 3, name: 'Texas', score: 82 },
];

describe('SortableTable', () => {
  it('renders loading spinner when isLoading is true', () => {
    render(
      <SortableTable columns={stringHeaderColumns} data={[]} isLoading={true} />
    );

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders empty message when data is empty', () => {
    render(
      <SortableTable columns={stringHeaderColumns} data={[]} isLoading={false} />
    );

    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });

  it('renders custom empty message', () => {
    render(
      <SortableTable
        columns={stringHeaderColumns}
        data={[]}
        isLoading={false}
        emptyMessage="Nothing here."
      />
    );

    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  });

  it('renders table rows with data', () => {
    render(
      <SortableTable columns={stringHeaderColumns} data={testData} isLoading={false} />
    );

    expect(screen.getByText('Alabama')).toBeInTheDocument();
    expect(screen.getByText('Ohio State')).toBeInTheDocument();
    expect(screen.getByText('Texas')).toBeInTheDocument();
  });

  it('uses header.id for aria-label when header is not a string', () => {
    render(
      <SortableTable columns={renderHeaderColumns} data={testData} isLoading={false} />
    );

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    const nameHeader = screen.getByTestId('custom-header').closest('th')!;
    expect(nameHeader).toHaveAttribute('aria-label', 'Sort by name');
  });

  it('uses header string for aria-label when header is a string', () => {
    render(
      <SortableTable columns={stringHeaderColumns} data={testData} isLoading={false} />
    );

    const scoreHeader = screen.getByText('Score').closest('th')!;
    expect(scoreHeader).toHaveAttribute('aria-label', 'Sort by Score');
  });

  it('shows ascending sort indicator after clicking a string column header', async () => {
    render(
      <SortableTable columns={stringHeaderColumns} data={testData} isLoading={false} />
    );

    const nameHeader = screen.getByText('Name').closest('th')!;
    await userEvent.click(nameHeader);

    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(nameHeader.textContent).toContain('\u25B2');
  });

  it('shows descending sort indicator after clicking a string column header twice', async () => {
    render(
      <SortableTable columns={stringHeaderColumns} data={testData} isLoading={false} />
    );

    const nameHeader = screen.getByText('Name').closest('th')!;
    await userEvent.click(nameHeader);
    await userEvent.click(nameHeader);

    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(nameHeader.textContent).toContain('\u25BC');
  });

  it('shows no sort indicator on unsorted columns', () => {
    render(
      <SortableTable columns={stringHeaderColumns} data={testData} isLoading={false} />
    );

    const scoreHeader = screen.getByText('Score').closest('th')!;
    expect(scoreHeader).toHaveAttribute('aria-sort', 'none');
    expect(scoreHeader.textContent).not.toContain('\u25B2');
    expect(scoreHeader.textContent).not.toContain('\u25BC');
  });
});
