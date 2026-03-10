import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { rechartsMock } from '../mocks/recharts';

vi.mock('recharts', () => rechartsMock);

vi.mock('../../contexts/theme-context', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

import { SeasonTrendsPage } from '../../pages/season-trends-page';

vi.mock('../../hooks/use-season-trends', () => ({
  useSeasonTrends: vi.fn(),
}));

vi.mock('../../hooks/use-document-title', () => ({
  useDocumentTitle: vi.fn(),
}));

const mockSetSelectedSeason = vi.fn();

vi.mock('../../contexts/season-context', () => ({
  useSeason: () => ({
    seasons: [2024, 2023],
    seasonsLoading: false,
    selectedSeason: 2024,
    setSelectedSeason: mockSetSelectedSeason,
    seasonsError: null,
    refetchSeasons: vi.fn(),
  }),
}));

import { useSeasonTrends } from '../../hooks/use-season-trends';

const mockData = {
  season: 2024,
  teams: [
    {
      altColor: '#FFFFFF',
      color: '#BB0000',
      conference: 'Big Ten',
      logoURL: 'https://example.com/ohio-state.png',
      rankings: [
        { rank: 1, rating: 95.0, record: '8-0', weekNumber: 1 },
      ],
      teamName: 'Ohio State',
    },
    {
      altColor: '#FFCB05',
      color: '#00274C',
      conference: 'Big Ten',
      logoURL: 'https://example.com/michigan.png',
      rankings: [
        { rank: 2, rating: 90.0, record: '7-1', weekNumber: 1 },
      ],
      teamName: 'Michigan',
    },
  ],
  weeks: [
    { label: 'Week 2', weekNumber: 1 },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/season-trends']}>
      <SeasonTrendsPage />
    </MemoryRouter>
  );
}

describe('SeasonTrendsPage', () => {
  it('renders loading state when isLoading is true', () => {
    vi.mocked(useSeasonTrends).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSeasonTrends>);

    renderPage();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    vi.mocked(useSeasonTrends).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSeasonTrends>);

    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Season Trends' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    vi.mocked(useSeasonTrends).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Something went wrong'),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSeasonTrends>);

    renderPage();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked', async () => {
    const mockRefetch = vi.fn();
    vi.mocked(useSeasonTrends).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useSeasonTrends>);

    renderPage();

    await userEvent.click(screen.getByText('Retry'));

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders season dropdown', () => {
    vi.mocked(useSeasonTrends).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSeasonTrends>);

    renderPage();

    expect(screen.getByLabelText('Season')).toBeInTheDocument();
  });

  it('changes season when dropdown changes', async () => {
    vi.mocked(useSeasonTrends).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSeasonTrends>);

    renderPage();

    const seasonSelect = screen.getByLabelText('Season');
    await userEvent.selectOptions(seasonSelect, '2023');

    expect(mockSetSelectedSeason).toHaveBeenCalledWith(2023);
  });

  it('does not render chart when data is undefined', () => {
    vi.mocked(useSeasonTrends).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSeasonTrends>);

    renderPage();

    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });
});
