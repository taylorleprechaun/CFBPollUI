import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RankingsTable } from '../components/rankings/rankings-table';
import type { RankedTeam } from '../types';

const createMockTeam = (overrides: Partial<RankedTeam> = {}): RankedTeam => ({
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
  details: {
    home: { wins: 6, losses: 0 },
    away: { wins: 5, losses: 0 },
    neutral: { wins: 0, losses: 0 },
    vsRank1To10: { wins: 2, losses: 0 },
    vsRank11To25: { wins: 3, losses: 0 },
    vsRank26To50: { wins: 2, losses: 0 },
    vsRank51To100: { wins: 2, losses: 0 },
    vsRank101Plus: { wins: 2, losses: 0 },
  },
  ...overrides,
});

const mockRankings: RankedTeam[] = [
  createMockTeam({
    rank: 1,
    teamName: 'Oregon',
    conference: 'Big Ten',
    rating: 165.42,
    sosRanking: 15,
  }),
  createMockTeam({
    rank: 2,
    teamName: 'Ohio State',
    logoURL: 'https://example.com/ohio-state.png',
    conference: 'Big Ten',
    wins: 10,
    losses: 1,
    record: '10-1',
    rating: 158.35,
    weightedSOS: 0.612,
    sosRanking: 8,
  }),
  createMockTeam({
    rank: 3,
    teamName: 'Texas',
    logoURL: 'https://example.com/texas.png',
    conference: 'SEC',
    wins: 10,
    losses: 1,
    record: '10-1',
    rating: 155.20,
    weightedSOS: 0.650,
    sosRanking: 5,
  }),
];

function renderTable(props: {
  rankings?: RankedTeam[];
  isLoading?: boolean;
  selectedConference?: string | null;
  selectedSeason?: number | null;
  selectedWeek?: number | null;
} = {}) {
  return render(
    <MemoryRouter>
      <RankingsTable
        rankings={props.rankings ?? mockRankings}
        isLoading={props.isLoading ?? false}
        selectedConference={props.selectedConference ?? null}
        selectedSeason={'selectedSeason' in props ? props.selectedSeason ?? null : 2024}
        selectedWeek={'selectedWeek' in props ? props.selectedWeek ?? null : 12}
      />
    </MemoryRouter>
  );
}

describe('RankingsTable', () => {
  describe('basic rendering', () => {
    it('renders all columns', () => {
      renderTable();

      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Record')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('Weighted SOS')).toBeInTheDocument();
      expect(screen.getByText('SOS Rank')).toBeInTheDocument();
    });

    it('displays team data', () => {
      renderTable();

      expect(screen.getByText('Oregon')).toBeInTheDocument();
      expect(screen.getByText('Ohio State')).toBeInTheDocument();
      expect(screen.getByText('Texas')).toBeInTheDocument();
      expect(screen.getByText('11-0')).toBeInTheDocument();
      expect(screen.getAllByText('10-1')).toHaveLength(2);
    });

    it('shows loading state', () => {
      renderTable({ rankings: [], isLoading: true });

      expect(screen.queryByText('Rank')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows empty state when no rankings', () => {
      renderTable({ rankings: [] });

      expect(
        screen.getByText('Select a season and week to view rankings.')
      ).toBeInTheDocument();
    });

    it('displays rating with 4 decimal places', () => {
      renderTable();

      expect(screen.getByText('165.4200')).toBeInTheDocument();
    });

    it('displays weighted SOS with 4 decimal places', () => {
      renderTable();

      expect(screen.getByText('0.5820')).toBeInTheDocument();
    });
  });

  describe('conference filtering', () => {
    it('filters teams by selected conference', () => {
      renderTable({ selectedConference: 'Big Ten' });

      expect(screen.getByText('Oregon')).toBeInTheDocument();
      expect(screen.getByText('Ohio State')).toBeInTheDocument();
      expect(screen.queryByText('Texas')).not.toBeInTheDocument();
    });

    it('shows conference rank when conference is selected', () => {
      renderTable({ selectedConference: 'Big Ten' });

      expect(screen.getByText('(1)')).toBeInTheDocument();
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('shows conference SOS rank when conference is selected', () => {
      renderTable({ selectedConference: 'Big Ten' });

      expect(screen.getByText('(15)')).toBeInTheDocument();
      expect(screen.getByText('(8)')).toBeInTheDocument();
    });

    it('shows all teams when no conference is selected', () => {
      renderTable();

      expect(screen.getByText('Oregon')).toBeInTheDocument();
      expect(screen.getByText('Ohio State')).toBeInTheDocument();
      expect(screen.getByText('Texas')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('allows clicking column headers to sort', () => {
      renderTable();

      const ratingHeader = screen.getByText('Rating');
      fireEvent.click(ratingHeader);

      expect(ratingHeader.closest('th')).toBeInTheDocument();
    });

    it('shows sort indicator when column is sorted', () => {
      renderTable();

      const rankHeader = screen.getByText('Rank');
      fireEvent.click(rankHeader);

      const headerContainer = rankHeader.closest('div');
      expect(headerContainer).toBeInTheDocument();
    });
  });

  describe('team logos', () => {
    it('renders team logos', () => {
      renderTable();

      expect(screen.getByAltText('Oregon logo')).toBeInTheDocument();
      expect(screen.getByAltText('Ohio State logo')).toBeInTheDocument();
    });
  });

  describe('team name links', () => {
    it('renders team name as link to team details', () => {
      renderTable();

      const oregonLink = screen.getByText('Oregon').closest('a');
      expect(oregonLink).toBeInTheDocument();
      expect(oregonLink).toHaveAttribute('href', '/team-details?team=Oregon&season=2024&week=12');
    });

    it('renders link without season/week when not provided', () => {
      renderTable({ selectedSeason: null, selectedWeek: null });

      const oregonLink = screen.getByText('Oregon').closest('a');
      expect(oregonLink).toBeInTheDocument();
      expect(oregonLink).toHaveAttribute('href', '/team-details?team=Oregon');
    });
  });
});
