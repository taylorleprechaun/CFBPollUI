import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AllTimePage } from '../../pages/all-time-page';

vi.mock('../../hooks/use-all-time', () => ({
  useAllTime: vi.fn(),
}));

import { useAllTime } from '../../hooks/use-all-time';

const mockAllTimeData = {
  bestTeams: [
    {
      allTimeRank: 1,
      logoURL: 'https://example.com/georgia.png',
      losses: 0,
      rank: 1,
      rating: 55.0,
      record: '13-0',
      season: 2023,
      teamName: 'Georgia',
      weightedSOS: 0.85,
      week: 5,
      wins: 13,
    },
  ],
  worstTeams: [
    {
      allTimeRank: 1,
      logoURL: 'https://example.com/uconn.png',
      losses: 12,
      rank: 130,
      rating: 5.0,
      record: '0-12',
      season: 2022,
      teamName: 'UConn',
      weightedSOS: 0.3,
      week: 5,
      wins: 0,
    },
  ],
  hardestSchedules: [
    {
      allTimeRank: 1,
      logoURL: 'https://example.com/auburn.png',
      losses: 4,
      rank: 15,
      rating: 35.0,
      record: '8-4',
      season: 2021,
      teamName: 'Auburn',
      weightedSOS: 0.95,
      week: 5,
      wins: 8,
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AllTimePage />
    </MemoryRouter>
  );
}

describe('AllTimePage', () => {
  it('renders page title', () => {
    vi.mocked(useAllTime).mockReturnValue({
      data: mockAllTimeData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useAllTime>);

    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'All-Time Rankings' })
    ).toBeInTheDocument();
  });

  it('renders section headings', () => {
    vi.mocked(useAllTime).mockReturnValue({
      data: mockAllTimeData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useAllTime>);

    renderPage();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Best Teams' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Worst Teams' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Hardest Schedules' })
    ).toBeInTheDocument();
  });

  it('renders team names from data', () => {
    vi.mocked(useAllTime).mockReturnValue({
      data: mockAllTimeData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useAllTime>);

    renderPage();

    expect(screen.getByText('Georgia')).toBeInTheDocument();
    expect(screen.getByText('UConn')).toBeInTheDocument();
    expect(screen.getByText('Auburn')).toBeInTheDocument();
  });

  it('renders team names as links to team details', () => {
    vi.mocked(useAllTime).mockReturnValue({
      data: mockAllTimeData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useAllTime>);

    renderPage();

    const georgiaLink = screen.getByRole('link', { name: 'Georgia' });
    expect(georgiaLink).toHaveAttribute(
      'href',
      '/team-details?team=Georgia&season=2023&week=5'
    );
  });

  it('shows loading spinners when loading', () => {
    vi.mocked(useAllTime).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useAllTime>);

    renderPage();

    const spinners = document.querySelectorAll('.animate-spin');
    expect(spinners.length).toBe(3);
  });

  it('shows error alert when error occurs', () => {
    vi.mocked(useAllTime).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Something went wrong'),
      refetch: vi.fn(),
    } as ReturnType<typeof useAllTime>);

    renderPage();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows retry button on error', () => {
    const mockRefetch = vi.fn();
    vi.mocked(useAllTime).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Something went wrong'),
      refetch: mockRefetch,
    } as ReturnType<typeof useAllTime>);

    renderPage();

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders empty tables when data has empty arrays', () => {
    vi.mocked(useAllTime).mockReturnValue({
      data: { bestTeams: [], worstTeams: [], hardestSchedules: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useAllTime>);

    renderPage();

    const emptyMessages = screen.getAllByText('No data available.');
    expect(emptyMessages).toHaveLength(3);
  });

  it('sections are expanded by default with aria-expanded', () => {
    vi.mocked(useAllTime).mockReturnValue({
      data: mockAllTimeData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useAllTime>);

    renderPage();

    const buttons = screen.getAllByRole('button', { expanded: true });
    expect(buttons).toHaveLength(3);
  });

  it('collapses section when header is clicked', async () => {
    vi.mocked(useAllTime).mockReturnValue({
      data: mockAllTimeData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useAllTime>);

    renderPage();

    const bestTeamsButton = screen.getByRole('button', { name: /Best Teams/ });
    expect(screen.getByText('Georgia')).toBeInTheDocument();

    await userEvent.click(bestTeamsButton);

    expect(bestTeamsButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Georgia')).not.toBeInTheDocument();
  });

  it('collapses worst teams section when header is clicked', async () => {
    vi.mocked(useAllTime).mockReturnValue({
      data: mockAllTimeData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useAllTime>);

    renderPage();

    const worstTeamsButton = screen.getByRole('button', { name: /Worst Teams/ });
    expect(screen.getByText('UConn')).toBeInTheDocument();

    await userEvent.click(worstTeamsButton);

    expect(worstTeamsButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('UConn')).not.toBeInTheDocument();
  });

  it('collapses hardest schedules section when header is clicked', async () => {
    vi.mocked(useAllTime).mockReturnValue({
      data: mockAllTimeData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useAllTime>);

    renderPage();

    const hardestButton = screen.getByRole('button', { name: /Hardest Schedules/ });
    expect(screen.getByText('Auburn')).toBeInTheDocument();

    await userEvent.click(hardestButton);

    expect(hardestButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Auburn')).not.toBeInTheDocument();
  });

  it('re-expands section when header is clicked again', async () => {
    vi.mocked(useAllTime).mockReturnValue({
      data: mockAllTimeData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useAllTime>);

    renderPage();

    const bestTeamsButton = screen.getByRole('button', { name: /Best Teams/ });

    await userEvent.click(bestTeamsButton);
    expect(screen.queryByText('Georgia')).not.toBeInTheDocument();

    await userEvent.click(bestTeamsButton);
    expect(bestTeamsButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Georgia')).toBeInTheDocument();
  });
});
