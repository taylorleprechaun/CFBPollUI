import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RankedTeam } from '../../types';

vi.mock('../../hooks/use-rankings', () => ({
  useRankings: vi.fn(),
}));

vi.mock('../../hooks/use-season', () => ({
  useSeason: vi.fn(),
}));

vi.mock('../../hooks/use-week-selection', () => ({
  useWeekSelection: vi.fn(),
}));

vi.mock('../../hooks/use-weeks', () => ({
  useWeeks: vi.fn(),
}));

import { useRankings } from '../../hooks/use-rankings';
import { useSeason } from '../../hooks/use-season';
import { useWeekSelection } from '../../hooks/use-week-selection';
import { useWeeks } from '../../hooks/use-weeks';
import { HomePage } from '../../pages/home-page';

class MockIntersectionObserver {
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

const createMockTeam = (overrides: Partial<RankedTeam> = {}): RankedTeam => ({
  rank: 1,
  rankDelta: null,
  teamName: 'Oklahoma',
  logoURL: 'https://example.com/oklahoma.png',
  conference: 'SEC',
  division: '',
  wins: 5,
  losses: 0,
  record: '5-0',
  rating: 150.12,
  weightedSOS: 0.55,
  sosRanking: 10,
  details: null,
  ...overrides,
});

const mockRankings: RankedTeam[] = [
  createMockTeam({ rank: 1, rankDelta: 0, teamName: 'Oklahoma' }),
  createMockTeam({ rank: 2, rankDelta: 1, teamName: 'Michigan', logoURL: 'https://example.com/michigan.png' }),
  createMockTeam({ rank: 3, rankDelta: -1, teamName: 'Notre Dame', logoURL: 'https://example.com/notre-dame.png' }),
];

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));

  vi.mocked(useSeason).mockReturnValue({
    seasons: [2026],
    seasonsLoading: false,
    seasonsError: null,
    refetchSeasons: vi.fn(),
    selectedSeason: 2026,
    setSelectedSeason: vi.fn(),
  });

  vi.mocked(useWeeks).mockReturnValue({
    data: { season: 2026, weeks: [{ weekNumber: 3, label: 'Championship', rankingsPublished: true, predictionsPublished: true }] },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useWeeks>);

  vi.mocked(useWeekSelection).mockReturnValue({ selectedWeek: 3, setSelectedWeek: vi.fn() });

  vi.mocked(useRankings).mockReturnValue({
    data: { season: 2026, week: 3, rankings: mockRankings },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useRankings>);
});

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  it('falls back to the computed week label when the current week isn\'t in the fetched weeks list', () => {
    vi.mocked(useWeeks).mockReturnValue({
      data: { season: 2026, weeks: [{ weekNumber: 99, label: 'Bowls', rankingsPublished: true, predictionsPublished: true }] },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useWeeks>);

    renderHomePage();

    expect(screen.getByText(/Week 4/)).toBeInTheDocument();
  });

  it('falls back to the computed week label when weeks data hasn\'t loaded yet', () => {
    vi.mocked(useWeeks).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useWeeks>);

    renderHomePage();

    expect(screen.getByText(/Week 4/)).toBeInTheDocument();
  });

  it('has How It Works heading with id for scroll target', () => {
    renderHomePage();

    const heading = screen.getByRole('heading', { name: 'How It Works' });

    expect(heading).toHaveAttribute('id', 'how-it-works');
  });

  it('renders algorithm factors', () => {
    renderHomePage();

    expect(screen.getByText('Win-Loss Record')).toBeInTheDocument();
    expect(screen.getByText('Strength of Schedule')).toBeInTheDocument();
    expect(screen.getByText('Game Statistics')).toBeInTheDocument();
  });

  it('renders the found week label from the weeks list when the current week matches an entry', () => {
    renderHomePage();

    expect(screen.getByText(/Championship/)).toBeInTheDocument();
  });

  it('renders the heading', () => {
    renderHomePage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'College Football Rankings'
    );
  });

  it('renders the How It Works link scrolling to the anchor', () => {
    renderHomePage();

    const link = screen.getByRole('link', { name: /How It Works/i });

    expect(link).toHaveAttribute('href', '#how-it-works');
  });

  it('renders the rankings preview empty state when no rankings are available', () => {
    vi.mocked(useRankings).mockReturnValue({
      data: { season: 2026, week: 3, rankings: [] },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useRankings>);

    renderHomePage();

    expect(screen.getByText(/haven.t been published yet/i)).toBeInTheDocument();
  });

  it('renders the rankings preview empty state when no week has been published yet', () => {
    vi.mocked(useWeekSelection).mockReturnValue({ selectedWeek: null, setSelectedWeek: vi.fn() });
    vi.mocked(useRankings).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useRankings>);

    renderHomePage();

    expect(screen.getByText(/haven.t been published yet/i)).toBeInTheDocument();
  });

  it('renders the rankings preview loading skeleton while rankings are loading', () => {
    vi.mocked(useRankings).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useRankings>);

    const { container } = renderHomePage();

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText('Oklahoma')).not.toBeInTheDocument();
  });

  it('renders the rankings preview with real team data', () => {
    renderHomePage();

    expect(screen.getByText('Oklahoma')).toBeInTheDocument();
    expect(screen.getByText('Michigan')).toBeInTheDocument();
    expect(screen.getByText('Notre Dame')).toBeInTheDocument();
  });

  it('renders the View Full Rankings link pointing to /rankings', () => {
    renderHomePage();

    const link = screen.getByRole('link', { name: /View Full Rankings/ });

    expect(link).toHaveAttribute('href', '/rankings');
  });

  it('renders the View This Week’s Rankings link pointing to /rankings', () => {
    renderHomePage();

    const link = screen.getByRole('link', { name: /View This Week.s Rankings/i });

    expect(link).toHaveAttribute('href', '/rankings');
  });

  it('renders without a season/week label when there are no seasons yet', () => {
    vi.mocked(useSeason).mockReturnValue({
      seasons: [],
      seasonsLoading: false,
      seasonsError: null,
      refetchSeasons: vi.fn(),
      selectedSeason: null,
      setSelectedSeason: vi.fn(),
    });

    renderHomePage();

    expect(screen.queryByText(/Championship/)).not.toBeInTheDocument();
  });

  it('scrolls to how-it-works section when How It Works is clicked', async () => {
    const user = userEvent.setup();
    renderHomePage();

    const target = document.getElementById('how-it-works')!;
    target.scrollIntoView = vi.fn();

    const link = screen.getByRole('link', { name: /How It Works/i });
    await user.click(link);

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('sets the document title', () => {
    renderHomePage();

    expect(document.title).toBe('Taylor Steinberg - Home');
  });
});
