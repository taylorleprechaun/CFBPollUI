import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  AllTimeTable,
  allTimeRankColumn,
  teamNameColumn,
  seasonColumn,
  recordColumn,
  rankColumn,
  ratingColumn,
  weightedSOSColumn,
} from '../../../components/all-time/all-time-table';
import type { AllTimeEntry } from '../../../types';

const defaultColumns = [
  allTimeRankColumn,
  teamNameColumn,
  seasonColumn,
  recordColumn,
  rankColumn,
  ratingColumn,
  weightedSOSColumn,
];

const mockEntries: AllTimeEntry[] = [
  {
    allTimeRank: 1,
    logoURL: 'https://example.com/georgia.png',
    losses: 0,
    rank: 1,
    rating: 55.1234,
    record: '13-0',
    season: 2023,
    teamName: 'Georgia',
    weightedSOS: 0.8456,
    week: 5,
    wins: 13,
  },
  {
    allTimeRank: 2,
    logoURL: 'https://example.com/alabama.png',
    losses: 1,
    rank: 2,
    rating: 50.5678,
    record: '12-1',
    season: 2022,
    teamName: 'Alabama',
    weightedSOS: 0.7890,
    week: 5,
    wins: 12,
  },
];

function renderTable(
  props: Partial<React.ComponentProps<typeof AllTimeTable>> = {}
) {
  return render(
    <MemoryRouter>
      <AllTimeTable
        columns={defaultColumns}
        entries={mockEntries}
        isLoading={false}
        {...props}
      />
    </MemoryRouter>
  );
}

describe('AllTimeTable', () => {
  it('renders table headers', () => {
    renderTable();

    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Season')).toBeInTheDocument();
    expect(screen.getByText('Record')).toBeInTheDocument();
    expect(screen.getByText('Final Rank')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Weighted SOS')).toBeInTheDocument();
  });

  it('renders entry data', () => {
    renderTable();

    expect(screen.getByText('Georgia')).toBeInTheDocument();
    expect(screen.getByText('Alabama')).toBeInTheDocument();
    expect(screen.getByText('13-0')).toBeInTheDocument();
    expect(screen.getByText('12-1')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('2022')).toBeInTheDocument();
  });

  it('formats rating to 4 decimal places', () => {
    renderTable();

    expect(screen.getByText('55.1234')).toBeInTheDocument();
    expect(screen.getByText('50.5678')).toBeInTheDocument();
  });

  it('formats weightedSOS to 4 decimal places', () => {
    renderTable();

    expect(screen.getByText('0.8456')).toBeInTheDocument();
    expect(screen.getByText('0.7890')).toBeInTheDocument();
  });

  it('renders team name as link with correct URL', () => {
    renderTable();

    const georgiaLink = screen.getByRole('link', { name: 'Georgia' });
    expect(georgiaLink).toHaveAttribute(
      'href',
      '/team-details?team=Georgia&season=2023&week=5'
    );

    const alabamaLink = screen.getByRole('link', { name: 'Alabama' });
    expect(alabamaLink).toHaveAttribute(
      'href',
      '/team-details?team=Alabama&season=2022&week=5'
    );
  });

  it('renders team logos', () => {
    renderTable();

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/georgia.png');
    expect(images[0]).toHaveAttribute('alt', 'Georgia logo');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/alabama.png');
    expect(images[1]).toHaveAttribute('alt', 'Alabama logo');
  });

  it('encodes team name in URL', () => {
    const entries: AllTimeEntry[] = [
      {
        allTimeRank: 1,
        logoURL: 'https://example.com/sanjose.png',
        losses: 0,
        rank: 1,
        rating: 50.0,
        record: '12-0',
        season: 2023,
        teamName: 'San Jos\u00e9 State',
        weightedSOS: 0.5,
        week: 5,
        wins: 12,
      },
    ];

    renderTable({ entries });

    const link = screen.getByRole('link', { name: 'San Jos\u00e9 State' });
    expect(link).toHaveAttribute(
      'href',
      `/team-details?team=${encodeURIComponent('San Jos\u00e9 State')}&season=2023&week=5`
    );
  });

  it('shows loading spinner when isLoading is true', () => {
    renderTable({ isLoading: true });

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty message when entries is empty', () => {
    renderTable({ entries: [] });

    expect(screen.getByText('No data available.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders sortable column headers', () => {
    renderTable();

    const headers = screen.getAllByRole('columnheader');
    headers.forEach((header) => {
      expect(header).toHaveClass('cursor-pointer');
    });
  });

  it('renders correct number of rows', () => {
    renderTable();

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3); // 1 header + 2 data rows
  });

  it('renders allTimeRank values', () => {
    renderTable();

    const rows = screen.getAllByRole('row');
    const firstDataRow = within(rows[1]).getAllByRole('cell');
    expect(firstDataRow[0]).toHaveTextContent('1');

    const secondDataRow = within(rows[2]).getAllByRole('cell');
    expect(secondDataRow[0]).toHaveTextContent('2');
  });
});
