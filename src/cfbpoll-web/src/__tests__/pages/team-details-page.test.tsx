import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TeamDetailsPage } from '../../pages/team-details-page';

const mockSetSelectedSeason = vi.fn();
let mockSelectedSeason: number | null = 2024;

vi.mock('../../contexts/season-context', () => ({
  useSeason: () => ({
    seasons: [2024, 2023, 2022],
    seasonsLoading: false,
    seasonsError: null,
    selectedSeason: mockSelectedSeason,
    setSelectedSeason: mockSetSelectedSeason,
    refetchSeasons: vi.fn(),
  }),
}));

vi.mock('../../hooks/use-weeks', () => ({
  useWeeks: vi.fn(),
}));

vi.mock('../../hooks/use-rankings', () => ({
  useRankings: vi.fn(),
}));

vi.mock('../../hooks/use-team-detail', () => ({
  useTeamDetail: vi.fn(),
}));

import { useWeeks } from '../../hooks/use-weeks';
import { useRankings } from '../../hooks/use-rankings';
import { useTeamDetail } from '../../hooks/use-team-detail';

const mockWeeksData = {
  season: 2024,
  weeks: [
    { weekNumber: 1, label: 'Week 1' },
    { weekNumber: 12, label: 'Week 12' },
  ],
};
const mockRankingsData = {
  season: 2024,
  week: 12,
  rankings: [
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
    },
    {
      rank: 2,
      teamName: 'Georgia',
      logoURL: 'https://example.com/georgia.png',
      conference: 'SEC',
      division: 'East',
      wins: 10,
      losses: 1,
      record: '10-1',
      rating: 155.20,
      weightedSOS: 0.650,
      sosRanking: 5,
      details: {
        home: { wins: 6, losses: 0 },
        away: { wins: 4, losses: 1 },
        neutral: { wins: 0, losses: 0 },
        vsRank1To10: { wins: 1, losses: 1 },
        vsRank11To25: { wins: 2, losses: 0 },
        vsRank26To50: { wins: 2, losses: 0 },
        vsRank51To100: { wins: 3, losses: 0 },
        vsRank101Plus: { wins: 2, losses: 0 },
      },
    },
  ],
};
const mockTeamDetail = {
  altColor: '#FFD700',
  color: '#154733',
  conference: 'Big Ten',
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
  division: '',
  logoURL: 'https://example.com/oregon.png',
  rank: 1,
  rating: 165.42,
  record: '11-0',
  schedule: [
    {
      gameDate: '2024-09-07T19:30:00',
      isHome: true,
      isWin: true,
      neutralSite: false,
      opponentLogoURL: 'https://example.com/idaho.png',
      opponentName: 'Idaho',
      opponentRank: 120,
      opponentRecord: '3-8',
      opponentScore: 14,
      seasonType: 'regular',
      startTimeTbd: false,
      teamScore: 42,
      venue: 'Autzen Stadium',
      week: 1,
    },
    {
      gameDate: '2024-09-14T16:00:00',
      isHome: true,
      isWin: true,
      neutralSite: false,
      opponentLogoURL: 'https://example.com/portland-state.png',
      opponentName: 'Portland State',
      opponentRank: null,
      opponentRecord: '2-9',
      opponentScore: 7,
      seasonType: 'regular',
      startTimeTbd: false,
      teamScore: 55,
      venue: 'Autzen Stadium',
      week: 2,
    },
    {
      gameDate: '2024-12-28T20:00:00',
      isHome: false,
      isWin: true,
      neutralSite: true,
      opponentLogoURL: 'https://example.com/georgia.png',
      opponentName: 'Georgia',
      opponentRank: 2,
      opponentRecord: '10-1',
      opponentScore: 21,
      seasonType: 'postseason',
      startTimeTbd: false,
      teamScore: 35,
      venue: 'Mercedes-Benz Stadium',
      week: 1,
    },
  ],
  sosRanking: 15,
  teamName: 'Oregon',
  weightedSOS: 0.582,
};

function setupMocks(overrides: {
  weeksData?: typeof mockWeeksData | undefined;
  rankingsData?: typeof mockRankingsData | undefined;
  teamDetailData?: typeof mockTeamDetail | undefined;
  weeksLoading?: boolean;
  rankingsLoading?: boolean;
  teamDetailLoading?: boolean;
  teamDetailError?: Error | null;
} = {}) {
  const refetch = vi.fn();
  vi.mocked(useWeeks).mockReturnValue({
    data: overrides.weeksData ?? mockWeeksData,
    isLoading: overrides.weeksLoading ?? false,
    error: null,
    refetch,
  } as ReturnType<typeof useWeeks>);
  vi.mocked(useRankings).mockReturnValue({
    data: overrides.rankingsData ?? mockRankingsData,
    isLoading: overrides.rankingsLoading ?? false,
    error: null,
    refetch,
  } as ReturnType<typeof useRankings>);
  vi.mocked(useTeamDetail).mockReturnValue({
    data: overrides.teamDetailData ?? undefined,
    isLoading: overrides.teamDetailLoading ?? false,
    error: overrides.teamDetailError ?? null,
    refetch,
  } as ReturnType<typeof useTeamDetail>);
}

function renderPage(initialRoute = '/team-details') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <TeamDetailsPage />
    </MemoryRouter>
  );
}

describe('TeamDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedSeason = 2024;
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      setupMocks();
      renderPage();

      expect(screen.getByText('Team Details')).toBeInTheDocument();
    });

    it('renders season and team selectors', () => {
      setupMocks();
      renderPage();

      expect(screen.getByLabelText('Season:')).toBeInTheDocument();
      expect(screen.getByLabelText('Team:')).toBeInTheDocument();
    });

    it('shows placeholder when no team is selected', () => {
      setupMocks();
      renderPage();

      expect(
        screen.getByText('Select a season and team to view details.')
      ).toBeInTheDocument();
    });

    it('shows loading spinner when team detail is loading', () => {
      setupMocks({ teamDetailLoading: true });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('team detail display', () => {
    it('renders team name and conference', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const heading = screen.getByRole('heading', { level: 2, name: 'Oregon' });
      expect(heading).toBeInTheDocument();
      expect(screen.getByText('Big Ten')).toBeInTheDocument();
    });

    it('renders rank and rating', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('165.4200')).toBeInTheDocument();
    });

    it('renders SOS ranking and weighted SOS', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('#15')).toBeInTheDocument();
      expect(screen.getByText('0.5820')).toBeInTheDocument();
    });

    it('renders record', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('11-0')).toBeInTheDocument();
    });

    it('applies team color as background', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const banner = document.querySelector('[style*="background-color"]') as HTMLElement;
      expect(banner).toBeInTheDocument();
      expect(banner.style.backgroundColor).toBe('rgb(21, 71, 51)');
    });

    it('renders team logo with border classes', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const logo = screen.getByAltText('Oregon logo');
      expect(logo).toHaveClass('bg-white');
      expect(logo).toHaveClass('rounded-lg');
      expect(logo).toHaveClass('p-1');
    });
  });

  describe('schedule section', () => {
    it('renders schedule table headers', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Opponent')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
    });

    it('renders schedule header with team color', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const scheduleHeader = screen.getByText('Schedule').closest('div');
      expect(scheduleHeader).toBeInTheDocument();
      expect(scheduleHeader!.style.backgroundColor).toBe('rgb(21, 71, 51)');
    });

    it('renders schedule game rows', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('Idaho')).toBeInTheDocument();
      expect(screen.queryByText('at Georgia')).not.toBeInTheDocument();
      expect(screen.getByText('W 35-21')).toBeInTheDocument();
    });

    it('displays win results in green', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const winResult = screen.getByText('W 42-14');
      expect(winResult).toBeInTheDocument();
      expect(winResult).toHaveClass('text-green-600');
    });

    it('shows "Post" label for postseason games', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('Post')).toBeInTheDocument();
    });

    it('shows empty state when no games', () => {
      setupMocks({ teamDetailData: { ...mockTeamDetail, schedule: [] } });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('No games found for this season.')).toBeInTheDocument();
    });

    it('displays opponent rank when rank is 25 or less', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('does not display opponent rank when rank is greater than 25', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.queryByText('#120')).not.toBeInTheDocument();
    });

    it('renders FBS opponent name as a clickable link', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const georgiaLink = screen.getByRole('link', { name: /Georgia/ });
      expect(georgiaLink).toBeInTheDocument();
      expect(georgiaLink).toHaveAttribute('href', expect.stringContaining('/team-details?team=Georgia'));
    });

    it('does not render FCS opponent name as a clickable link', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.queryByRole('link', { name: /Idaho/ })).not.toBeInTheDocument();
      expect(screen.getByText('Idaho')).toBeInTheDocument();
    });

    it('opponent link includes season and week parameters', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const georgiaLink = screen.getByRole('link', { name: /Georgia/ });
      expect(georgiaLink).toHaveAttribute('href', expect.stringContaining('season=2024'));
    });
  });

  describe('record breakdown sections', () => {
    it('renders Record by Location section', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('Record by Location')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Away')).toBeInTheDocument();
      expect(screen.getByText('Neutral')).toBeInTheDocument();
    });

    it('renders record breakdown headers with team colors', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const locationHeader = screen.getByText('Record by Location');
      expect(locationHeader.style.backgroundColor).toBe('rgb(21, 71, 51)');

      const rankHeader = screen.getByText('Record vs Opponent Rank');
      expect(rankHeader.style.backgroundColor).toBe('rgb(21, 71, 51)');
    });

    it('renders Record vs Opponent Rank section', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('Record vs Opponent Rank')).toBeInTheDocument();
      expect(screen.getByText('vs #1-10')).toBeInTheDocument();
      expect(screen.getByText('vs #11-25')).toBeInTheDocument();
      expect(screen.getByText('vs #26-50')).toBeInTheDocument();
      expect(screen.getByText('vs #51-100')).toBeInTheDocument();
      expect(screen.getByText('vs #101+')).toBeInTheDocument();
    });

    it('displays dash for zero-record entries', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const neutralRow = screen.getByText('Neutral').closest('div');
      expect(neutralRow?.textContent).toContain('-');
    });

    it('expands record row on click to show individual games', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const homeRow = screen.getByText('Home').closest('button');
      expect(homeRow).toBeInTheDocument();
      fireEvent.click(homeRow!);

      const expandedContent = document.querySelector('.ml-4');
      expect(expandedContent).toBeInTheDocument();
      expect(expandedContent!.textContent).toContain('Idaho');
    });

    it('shows colored result in expanded game list', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const homeRow = screen.getByText('Home').closest('button');
      fireEvent.click(homeRow!);

      const winResult = screen.getByText('W 42-14', { selector: '.ml-4 span' });
      expect(winResult).toHaveClass('text-green-600');
    });

    it('collapses record row on second click', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const homeRow = screen.getByText('Home').closest('button');
      fireEvent.click(homeRow!);
      expect(document.querySelector('.ml-4')).toBeInTheDocument();

      fireEvent.click(homeRow!);
      expect(document.querySelector('.ml-4')).not.toBeInTheDocument();
    });

    it('does not make record row expandable when there are no games', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const neutralLabel = screen.getByText('Neutral');
      const neutralRow = neutralLabel.closest('div');
      expect(neutralRow).not.toHaveAttribute('role', 'button');
    });

    it('shows opponent rank in expanded game list', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const homeRow = screen.getByText('Home').closest('button');
      fireEvent.click(homeRow!);

      expect(screen.getByText(/^#120/)).toBeInTheDocument();
    });

    it('includes FCS opponents with null rank in vs #101+ expanded list', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const rank101Row = screen.getByText('vs #101+').closest('button');
      expect(rank101Row).toBeInTheDocument();
      fireEvent.click(rank101Row!);

      const expandedContent = rank101Row!.parentElement!.querySelector('.ml-4');
      expect(expandedContent).toBeInTheDocument();
      expect(expandedContent!.textContent).toContain('Portland State');
    });
  });

  describe('team selector', () => {
    it('populates team dropdown from rankings data', () => {
      setupMocks();
      renderPage();

      const teamSelect = screen.getByLabelText('Team:') as HTMLSelectElement;
      const options = Array.from(teamSelect.options).map(o => o.text);
      expect(options).toContain('Georgia');
      expect(options).toContain('Oregon');
    });

    it('sorts team options alphabetically', () => {
      setupMocks();
      renderPage();

      const teamSelect = screen.getByLabelText('Team:') as HTMLSelectElement;
      const teamOptions = Array.from(teamSelect.options)
        .filter(o => o.value !== '')
        .map(o => o.text);
      expect(teamOptions).toEqual(['Georgia', 'Oregon']);
    });

    it('handles team selection change', () => {
      setupMocks();
      renderPage();

      const teamSelect = screen.getByLabelText('Team:');
      fireEvent.change(teamSelect, { target: { value: 'Oregon' } });

      expect(vi.mocked(useTeamDetail)).toHaveBeenCalled();
    });
  });

  describe('URL parameter handling', () => {
    it('reads initial team from URL params', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const teamSelect = screen.getByLabelText('Team:') as HTMLSelectElement;
      expect(teamSelect.value).toBe('Oregon');
    });

    it('calls setSelectedSeason with URL season param', () => {
      setupMocks();
      renderPage('/team-details?season=2023');

      expect(mockSetSelectedSeason).toHaveBeenCalledWith(2023);
    });
  });

  describe('season change', () => {
    it('preserves team selection when season changes', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const seasonSelect = screen.getByLabelText('Season:') as HTMLSelectElement;
      fireEvent.change(seasonSelect, { target: { value: '2023' } });

      expect(mockSetSelectedSeason).toHaveBeenCalledWith(2023);
      const teamSelect = screen.getByLabelText('Team:') as HTMLSelectElement;
      expect(teamSelect.value).toBe('Oregon');
    });

    it('clears team when team does not exist in new season rankings', () => {
      const rankingsWithoutOregon = {
        ...mockRankingsData,
        rankings: [mockRankingsData.rankings[1]],
      };
      setupMocks({ rankingsData: rankingsWithoutOregon });
      renderPage('/team-details?team=Oregon&season=2023');

      const teamSelect = screen.getByLabelText('Team:') as HTMLSelectElement;
      expect(teamSelect.value).toBe('');
    });
  });

  describe('error handling', () => {
    it('shows error alert when weeks fail to load', () => {
      const refetch = vi.fn();
      vi.mocked(useWeeks).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Weeks failed'),
        refetch,
      } as ReturnType<typeof useWeeks>);
      vi.mocked(useRankings).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch,
      } as ReturnType<typeof useRankings>);
      vi.mocked(useTeamDetail).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch,
      } as ReturnType<typeof useTeamDetail>);

      renderPage();

      expect(screen.getByText(/Weeks failed/)).toBeInTheDocument();
    });

    it('calls refetch when retry is clicked for error', () => {
      const refetch = vi.fn();
      vi.mocked(useWeeks).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Weeks failed'),
        refetch,
      } as ReturnType<typeof useWeeks>);
      vi.mocked(useRankings).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch,
      } as ReturnType<typeof useRankings>);
      vi.mocked(useTeamDetail).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch,
      } as ReturnType<typeof useTeamDetail>);

      renderPage();

      fireEvent.click(screen.getByText('Retry'));
      expect(refetch).toHaveBeenCalled();
    });

    it('shows no details message when team selected but no data returned', () => {
      setupMocks({ teamDetailData: undefined });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('No details available for the selected team.')).toBeInTheDocument();
    });
  });

  describe('schedule interactions', () => {
    it('navigates when clicking opponent link', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const georgiaLink = screen.getByRole('link', { name: /Georgia/ });
      fireEvent.click(georgiaLink);

      expect(vi.mocked(useTeamDetail)).toHaveBeenCalled();
    });

    it('renders venue for games', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getAllByText('Autzen Stadium').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Mercedes-Benz Stadium').length).toBeGreaterThan(0);
    });

    it('shows TBD date when gameDate is null', () => {
      const detailWithTbdGame = {
        ...mockTeamDetail,
        schedule: [
          {
            gameDate: null,
            isHome: true,
            isWin: null,
            neutralSite: false,
            opponentLogoURL: 'https://example.com/tbd.png',
            opponentName: 'TBD Opponent',
            opponentRank: null,
            opponentRecord: null,
            opponentScore: null,
            seasonType: 'regular',
            startTimeTbd: true,
            teamScore: null,
            venue: null,
            week: 13,
          },
        ],
      };

      setupMocks({ teamDetailData: detailWithTbdGame });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('TBD')).toBeInTheDocument();
    });

    it('shows loss result in red', () => {
      const detailWithLoss = {
        ...mockTeamDetail,
        schedule: [
          {
            gameDate: '2024-09-21T12:00:00',
            isHome: false,
            isWin: false,
            neutralSite: false,
            opponentLogoURL: 'https://example.com/boise.png',
            opponentName: 'Boise State',
            opponentRank: 5,
            opponentRecord: '11-0',
            opponentScore: 35,
            seasonType: 'regular',
            startTimeTbd: false,
            teamScore: 21,
            venue: null,
            week: 3,
          },
        ],
      };

      setupMocks({ teamDetailData: detailWithLoss });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const lossResult = screen.getByText('L 21-35');
      expect(lossResult).toHaveClass('text-red-600');
    });

    it('shows "at" prefix for away games', () => {
      const awayGame = {
        ...mockTeamDetail,
        schedule: [
          {
            gameDate: '2024-10-05T19:00:00',
            isHome: false,
            isWin: true,
            neutralSite: false,
            opponentLogoURL: 'https://example.com/usc.png',
            opponentName: 'USC',
            opponentRank: 15,
            opponentRecord: '5-3',
            opponentScore: 14,
            seasonType: 'regular',
            startTimeTbd: false,
            teamScore: 28,
            venue: 'LA Coliseum',
            week: 5,
          },
        ],
      };

      setupMocks({ teamDetailData: awayGame });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const opponentCell = screen.getByText(/at.*USC/);
      expect(opponentCell).toBeInTheDocument();
    });

    it('shows "vs" prefix for neutral site games', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const neutralCell = screen.getByText(/vs.*Georgia/);
      expect(neutralCell).toBeInTheDocument();
    });
  });

  describe('logo error handling', () => {
    it('hides logo when image fails to load', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      const logo = screen.getByAltText('Oregon logo');
      expect(logo).toBeInTheDocument();

      fireEvent.error(logo);

      expect(screen.queryByAltText('Oregon logo')).not.toBeInTheDocument();
    });
  });

  describe('division display', () => {
    it('renders conference with division when present', () => {
      const detailWithDivision = {
        ...mockTeamDetail,
        conference: 'SEC',
        division: 'East',
      };

      setupMocks({ teamDetailData: detailWithDivision });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('SEC - East')).toBeInTheDocument();
    });

    it('renders conference without division when division is empty', () => {
      setupMocks({ teamDetailData: mockTeamDetail });
      renderPage('/team-details?team=Oregon&season=2024&week=12');

      expect(screen.getByText('Big Ten')).toBeInTheDocument();
      expect(screen.queryByText('Big Ten -')).not.toBeInTheDocument();
    });
  });
});
