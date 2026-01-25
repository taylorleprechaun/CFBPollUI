import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RankingsTable } from '../components/rankings/rankings-table';
import type { RankedTeam } from '../types';

const mockRankings: RankedTeam[] = [
  {
    rank: 1,
    teamName: 'Oregon',
    logoURL: 'https://example.com/oregon.png',
    conference: 'Big Ten',
    division: '',
    wins: 11,
    losses: 0,
    record: '11-0',
    rating: 165.42,
    weightedSOS: 0.582,
    sosRanking: 15,
  },
  {
    rank: 2,
    teamName: 'Ohio State',
    logoURL: 'https://example.com/ohio-state.png',
    conference: 'Big Ten',
    division: '',
    wins: 10,
    losses: 1,
    record: '10-1',
    rating: 158.35,
    weightedSOS: 0.612,
    sosRanking: 8,
  },
];

describe('RankingsTable', () => {
  it('renders all columns', () => {
    render(<RankingsTable rankings={mockRankings} isLoading={false} />);

    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Record')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Weighted SOS')).toBeInTheDocument();
    expect(screen.getByText('SOS Rank')).toBeInTheDocument();
  });

  it('displays team data', () => {
    render(<RankingsTable rankings={mockRankings} isLoading={false} />);

    expect(screen.getByText('Oregon')).toBeInTheDocument();
    expect(screen.getByText('Ohio State')).toBeInTheDocument();
    expect(screen.getByText('11-0')).toBeInTheDocument();
    expect(screen.getByText('10-1')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<RankingsTable rankings={[]} isLoading={true} />);

    expect(screen.queryByText('Rank')).not.toBeInTheDocument();
  });

  it('shows empty state when no rankings', () => {
    render(<RankingsTable rankings={[]} isLoading={false} />);

    expect(
      screen.getByText('Select a season and week to view rankings.')
    ).toBeInTheDocument();
  });
});
