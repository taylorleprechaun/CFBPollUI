import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { RankedTeam } from '../types';

import { RankingsTable } from '../components/rankings/rankings-table';

const createMockTeam = (overrides: Partial<RankedTeam> = {}): RankedTeam => ({
  rank: 1,
  rankDelta: null,
  teamName: 'USC',
  logoURL: 'https://example.com/usc.png',
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
    rankDelta: 3,
    teamName: 'USC',
    conference: 'Big Ten',
    rating: 165.42,
    sosRanking: 15,
  }),
  createMockTeam({
    rank: 2,
    rankDelta: -2,
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
    rankDelta: 0,
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
  isLoading?: boolean;
  rankings?: RankedTeam[];
  selectedConference?: string | null;
  selectedSeason?: number | null;
  showRatingZScore?: boolean;
} = {}) {
  return render(
    <MemoryRouter>
      <RankingsTable
        rankings={props.rankings ?? mockRankings}
        isLoading={props.isLoading ?? false}
        selectedConference={props.selectedConference ?? null}
        selectedSeason={'selectedSeason' in props ? props.selectedSeason ?? null : 2024}
        showRatingZScore={props.showRatingZScore ?? false}
      />
    </MemoryRouter>
  );
}

describe('RankingsTable', () => {
  describe('basic rendering', () => {
    it('displays rating with 4 decimal places', () => {
      renderTable();

      expect(screen.getByText('165.4200')).toBeInTheDocument();
    });

    it('displays team data', () => {
      renderTable();

      expect(screen.getByText('USC')).toBeInTheDocument();
      expect(screen.getByText('Ohio State')).toBeInTheDocument();
      expect(screen.getByText('Texas')).toBeInTheDocument();
      expect(screen.getByText('11-0')).toBeInTheDocument();
      expect(screen.getAllByText('10-1')).toHaveLength(2);
    });

    it('displays weighted SOS with 4 decimal places', () => {
      renderTable();

      expect(screen.getByText('0.5820')).toBeInTheDocument();
    });

    it('renders all columns', () => {
      renderTable();

      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Record')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('Weighted SOS')).toBeInTheDocument();
      expect(screen.getByText('SOS Rank')).toBeInTheDocument();
      expect(screen.getByText('\u0394')).toBeInTheDocument();
    });

    it('shows empty state when no rankings', () => {
      renderTable({ rankings: [] });

      expect(
        screen.getByText('Select a season and week to view rankings.')
      ).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderTable({ rankings: [], isLoading: true });

      expect(screen.queryByText('Rank')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('conference filtering', () => {
    it('filters teams by selected conference', () => {
      renderTable({ selectedConference: 'Big Ten' });

      expect(screen.getByText('USC')).toBeInTheDocument();
      expect(screen.getByText('Ohio State')).toBeInTheDocument();
      expect(screen.queryByText('Texas')).not.toBeInTheDocument();
    });

    it('shows all teams when no conference is selected', () => {
      renderTable();

      expect(screen.getByText('USC')).toBeInTheDocument();
      expect(screen.getByText('Ohio State')).toBeInTheDocument();
      expect(screen.getByText('Texas')).toBeInTheDocument();
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
  });

  describe('rank delta column', () => {
    it('delta column is sortable', async () => {
      renderTable();

      const deltaHeader = screen.getByText('\u0394');
      await userEvent.click(deltaHeader);

      const th = deltaHeader.closest('th')!;
      expect(th).toHaveAttribute('aria-sort');
    });

    it('does not show negative sign for negative delta', () => {
      renderTable();

      const downCell = screen.getByText((_content, element) =>
        element?.tagName === 'SPAN' &&
        element.classList.contains('text-red-600') &&
        element.querySelector('svg') !== null
      );
      expect(downCell.textContent).not.toContain('-');
    });

    it('shows gray hyphen for null delta', () => {
      const rankings = [createMockTeam({ rank: 1, rankDelta: null, teamName: 'Nebraska' })];
      renderTable({ rankings });

      const cells = screen.getAllByText('-');
      const grayHyphen = cells.find(
        (el) => el.tagName === 'SPAN' && el.classList.contains('text-text-muted')
      );
      expect(grayHyphen).toBeInTheDocument();
    });

    it('shows gray hyphen for zero delta', () => {
      renderTable();

      const cells = screen.getAllByText('-');
      const grayHyphen = cells.find(
        (el) => el.tagName === 'SPAN' && el.classList.contains('text-text-muted')
      );
      expect(grayHyphen).toBeInTheDocument();
    });

    it('shows green up arrow for positive delta', () => {
      renderTable();

      const upCell = screen.getByText((content, element) =>
        element?.tagName === 'SPAN' &&
        element.classList.contains('text-green-600') &&
        content.includes('3')
      );
      expect(upCell).toBeInTheDocument();
      expect(upCell.querySelector('svg')).toBeInTheDocument();
    });

    it('shows red down arrow for negative delta', () => {
      renderTable();

      const downCell = screen.getByText((content, element) =>
        element?.tagName === 'SPAN' &&
        element.classList.contains('text-red-600') &&
        content.includes('2')
      );
      expect(downCell).toBeInTheDocument();
      expect(downCell.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('rating z-score column', () => {
    it('computes z-score against the full team list even when a conference filter is applied', () => {
      const rankings = [
        createMockTeam({ teamName: 'Team A', conference: 'Big Ten', rating: 50 }),
        createMockTeam({ teamName: 'Team B', conference: 'Big Ten', rating: 40 }),
        createMockTeam({ teamName: 'Team C', conference: 'SEC', rating: 45 }),
        createMockTeam({ teamName: 'Team D', conference: 'SEC', rating: 25 }),
      ];

      renderTable({ rankings, selectedConference: 'Big Ten', showRatingZScore: true });

      expect(screen.getByText('50.0000')).toBeInTheDocument();
      expect(screen.getByText('(1.07)')).toBeInTheDocument();
      expect(screen.getByText('40.0000')).toBeInTheDocument();
      expect(screen.getByText('(0.00)')).toBeInTheDocument();
      expect(screen.queryByText('Team C')).not.toBeInTheDocument();
    });

    it('renders the z-score header instead of the plain rating header', () => {
      renderTable({ showRatingZScore: true });

      expect(screen.getByText('Rating (Z-Score)')).toBeInTheDocument();
      expect(screen.queryByText('Rating')).not.toBeInTheDocument();
    });

    it('renders the z-score in muted, smaller text', () => {
      const rankings = [
        createMockTeam({ teamName: 'Team A', rating: 50 }),
        createMockTeam({ teamName: 'Team B', rating: 40 }),
        createMockTeam({ teamName: 'Team C', rating: 30 }),
      ];

      renderTable({ rankings, showRatingZScore: true });

      const zScore = screen.getByText('(1.22)');
      expect(zScore).toHaveClass('text-text-muted', 'text-xs');
    });

    it('shows the plain rating column when showRatingZScore is false', () => {
      renderTable();

      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.queryByText('Rating (Z-Score)')).not.toBeInTheDocument();
    });

    it('shows z-score and raw rating together', () => {
      const rankings = [
        createMockTeam({ teamName: 'Team A', rating: 50 }),
        createMockTeam({ teamName: 'Team B', rating: 40 }),
        createMockTeam({ teamName: 'Team C', rating: 30 }),
      ];

      renderTable({ rankings, showRatingZScore: true });

      expect(screen.getByText('50.0000')).toBeInTheDocument();
      expect(screen.getByText('(1.22)')).toBeInTheDocument();
      expect(screen.getByText('40.0000')).toBeInTheDocument();
      expect(screen.getByText('(0.00)')).toBeInTheDocument();
      expect(screen.getByText('30.0000')).toBeInTheDocument();
      expect(screen.getByText('(-1.22)')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('allows clicking column headers to sort', async () => {
      renderTable();

      const ratingHeader = screen.getByText('Rating');
      await userEvent.click(ratingHeader);

      expect(ratingHeader.closest('th')).toBeInTheDocument();
    });

    it('shows ascending indicator when numeric column is sorted twice', async () => {
      renderTable();

      const rankHeader = screen.getByText('Rank');
      await userEvent.click(rankHeader);
      await userEvent.click(rankHeader);

      const th = rankHeader.closest('th')!;
      expect(th).toHaveAttribute('aria-sort', 'ascending');
      expect(th.querySelector('svg')).toBeInTheDocument();
    });

    it('shows descending indicator when numeric column is sorted first', async () => {
      renderTable();

      const rankHeader = screen.getByText('Rank');
      await userEvent.click(rankHeader);

      const th = rankHeader.closest('th')!;
      expect(th).toHaveAttribute('aria-sort', 'descending');
      expect(th.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('team logos', () => {
    it('renders team logos', () => {
      renderTable();

      expect(screen.getByAltText('USC logo')).toBeInTheDocument();
      expect(screen.getByAltText('Ohio State logo')).toBeInTheDocument();
    });
  });

  describe('team name links', () => {
    it('renders link without season when not provided', () => {
      renderTable({ selectedSeason: null });

      const uscLink = screen.getByText('USC').closest('a');
      expect(uscLink).toBeInTheDocument();
      expect(uscLink).toHaveAttribute('href', '/team-details?team=USC');
    });

    it('renders team name as link to team details', () => {
      renderTable();

      const uscLink = screen.getByText('USC').closest('a');
      expect(uscLink).toBeInTheDocument();
      expect(uscLink).toHaveAttribute('href', '/team-details?team=USC&season=2024');
    });
  });
});
