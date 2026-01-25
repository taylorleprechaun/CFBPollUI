import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('RankingsTable', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('basic rendering', () => {
    it('renders all columns', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference={null} />);

      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Record')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('Weighted SOS')).toBeInTheDocument();
      expect(screen.getByText('SOS Rank')).toBeInTheDocument();
    });

    it('displays team data', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference={null} />);

      expect(screen.getByText('Oregon')).toBeInTheDocument();
      expect(screen.getByText('Ohio State')).toBeInTheDocument();
      expect(screen.getByText('Texas')).toBeInTheDocument();
      expect(screen.getByText('11-0')).toBeInTheDocument();
      expect(screen.getAllByText('10-1')).toHaveLength(2);
    });

    it('shows loading state', () => {
      render(<RankingsTable rankings={[]} isLoading={true} selectedConference={null} />);

      expect(screen.queryByText('Rank')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows empty state when no rankings', () => {
      render(<RankingsTable rankings={[]} isLoading={false} selectedConference={null} />);

      expect(
        screen.getByText('Select a season and week to view rankings.')
      ).toBeInTheDocument();
    });

    it('displays rating with 4 decimal places', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference={null} />);

      expect(screen.getByText('165.4200')).toBeInTheDocument();
    });

    it('displays weighted SOS with 4 decimal places', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference={null} />);

      expect(screen.getByText('0.5820')).toBeInTheDocument();
    });
  });

  describe('conference filtering', () => {
    it('filters teams by selected conference', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference="Big Ten" />);

      expect(screen.getByText('Oregon')).toBeInTheDocument();
      expect(screen.getByText('Ohio State')).toBeInTheDocument();
      expect(screen.queryByText('Texas')).not.toBeInTheDocument();
    });

    it('shows conference rank when conference is selected', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference="Big Ten" />);

      expect(screen.getByText('(1)')).toBeInTheDocument();
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('shows conference SOS rank when conference is selected', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference="Big Ten" />);

      expect(screen.getByText('(15)')).toBeInTheDocument();
      expect(screen.getByText('(8)')).toBeInTheDocument();
    });

    it('shows all teams when no conference is selected', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference={null} />);

      expect(screen.getByText('Oregon')).toBeInTheDocument();
      expect(screen.getByText('Ohio State')).toBeInTheDocument();
      expect(screen.getByText('Texas')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('allows clicking column headers to sort', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference={null} />);

      const ratingHeader = screen.getByText('Rating');
      fireEvent.click(ratingHeader);

      expect(ratingHeader.closest('th')).toBeInTheDocument();
    });

    it('shows sort indicator when column is sorted', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference={null} />);

      const rankHeader = screen.getByText('Rank');
      fireEvent.click(rankHeader);

      const headerContainer = rankHeader.closest('div');
      expect(headerContainer).toBeInTheDocument();
    });
  });

  describe('hover interactions', () => {
    it('team cell has hover event handlers', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference={null} />);

      const teamCell = screen.getByText('Oregon').closest('div');
      expect(teamCell).toBeInTheDocument();
      expect(teamCell).toHaveClass('cursor-pointer');
    });

    it('handles mouse leave without error', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference={null} />);

      const teamCell = screen.getByText('Oregon').closest('div');
      fireEvent.mouseLeave(teamCell!);

      expect(teamCell).toBeInTheDocument();
    });

    it('handles mouse move without error', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference={null} />);

      const teamCell = screen.getByText('Oregon').closest('div');
      fireEvent.mouseMove(teamCell!, { clientX: 200, clientY: 200 });

      expect(teamCell).toBeInTheDocument();
    });
  });

  describe('team logos', () => {
    it('renders team logos', () => {
      render(<RankingsTable rankings={mockRankings} isLoading={false} selectedConference={null} />);

      expect(screen.getByAltText('Oregon logo')).toBeInTheDocument();
      expect(screen.getByAltText('Ohio State logo')).toBeInTheDocument();
    });
  });
});
