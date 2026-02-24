import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { rechartsMock } from '../mocks/recharts';

vi.mock('recharts', () => rechartsMock);

import { PollLeadersPage } from '../../pages/poll-leaders-page';

vi.mock('../../hooks/use-poll-leaders', () => ({
  usePollLeaders: vi.fn(),
}));

vi.mock('../../hooks/use-document-title', () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock('../../hooks/use-page-visibility', () => ({
  usePageVisibility: () => ({
    allTimeEnabled: true,
    isLoading: false,
    pollLeadersEnabled: true,
  }),
}));

import { usePollLeaders } from '../../hooks/use-poll-leaders';

const mockData = {
  allWeeks: [
    { logoURL: 'https://example.com/ohio-state.png', teamName: 'Ohio State', top5Count: 5, top10Count: 8, top25Count: 15 },
    { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18 },
  ],
  finalWeeksOnly: [
    { logoURL: 'https://example.com/ohio-state.png', teamName: 'Ohio State', top5Count: 2, top10Count: 3, top25Count: 5 },
  ],
  minAvailableSeason: 2002,
  maxAvailableSeason: 2024,
};

function renderPage(initialEntries: string[] = ['/poll-leaders']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <PollLeadersPage />
    </MemoryRouter>
  );
}

describe('PollLeadersPage', () => {
  it('renders loading state when isLoading is true', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Poll Leaders' })
    ).toBeInTheDocument();
  });

  it('renders year range selectors when data is loaded', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage();

    expect(screen.getByLabelText('Minimum year')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum year')).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Something went wrong'),
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('does not render year selectors or chart when data is undefined', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage();

    expect(screen.queryByLabelText('Minimum year')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Maximum year')).not.toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked', async () => {
    const mockRefetch = vi.fn();
    vi.mocked(usePollLeaders).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    } as ReturnType<typeof usePollLeaders>);

    renderPage();

    await userEvent.click(screen.getByText('Retry'));

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('defaults mode to all', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage();

    expect(screen.getByText('All Weeks')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Final Only')).toHaveAttribute('aria-pressed', 'false');
  });

  it('defaults topN to 10', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage();

    expect(screen.getByText('Top 10')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Top 5')).toHaveAttribute('aria-pressed', 'false');
  });

  it('reads mode=final from search params', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage(['/poll-leaders?mode=final']);

    expect(screen.getByText('Final Only')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('All Weeks')).toHaveAttribute('aria-pressed', 'false');
  });

  it('reads topN=5 from search params', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage(['/poll-leaders?topN=5']);

    expect(screen.getByText('Top 5')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Top 10')).toHaveAttribute('aria-pressed', 'false');
  });

  it('updates mode when mode toggle is clicked', async () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage();

    await userEvent.click(screen.getByText('Final Only'));

    expect(screen.getByText('Final Only')).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates topN when topN toggle is clicked', async () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage();

    await userEvent.click(screen.getByText('Top 5'));

    expect(screen.getByText('Top 5')).toHaveAttribute('aria-pressed', 'true');
  });

  it('seeds search params from API data when none are set', async () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage();

    await waitFor(() => {
      const minSlider = screen.getByLabelText('Minimum year') as HTMLInputElement;
      expect(minSlider.value).toBe('2002');
    });

    const maxSlider = screen.getByLabelText('Maximum year') as HTMLInputElement;
    expect(maxSlider.value).toBe('2024');
  });

  it('does not overwrite existing search params with API data', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage(['/poll-leaders?minSeason=2010&maxSeason=2020']);

    const minSlider = screen.getByLabelText('Minimum year') as HTMLInputElement;
    const maxSlider = screen.getByLabelText('Maximum year') as HTMLInputElement;
    expect(minSlider.value).toBe('2010');
    expect(maxSlider.value).toBe('2020');
  });

  it('normalizes invalid mode param to all', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage(['/poll-leaders?mode=invalid']);

    expect(screen.getByText('All Weeks')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Final Only')).toHaveAttribute('aria-pressed', 'false');
  });

  it('normalizes invalid topN param to 10', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage(['/poll-leaders?topN=garbage']);

    expect(screen.getByText('Top 10')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Top 5')).toHaveAttribute('aria-pressed', 'false');
  });

  it('updates minSeason when min slider changes', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage(['/poll-leaders?minSeason=2002&maxSeason=2024']);

    fireEvent.change(screen.getByLabelText('Minimum year'), { target: { value: '2010' } });

    const minSlider = screen.getByLabelText('Minimum year') as HTMLInputElement;
    expect(minSlider.value).toBe('2010');
  });

  it('updates maxSeason when max slider changes', () => {
    vi.mocked(usePollLeaders).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePollLeaders>);

    renderPage(['/poll-leaders?minSeason=2002&maxSeason=2024']);

    fireEvent.change(screen.getByLabelText('Maximum year'), { target: { value: '2020' } });

    const maxSlider = screen.getByLabelText('Maximum year') as HTMLInputElement;
    expect(maxSlider.value).toBe('2020');
  });
});
