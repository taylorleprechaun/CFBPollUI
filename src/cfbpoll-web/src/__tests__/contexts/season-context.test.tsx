import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SeasonProvider, useSeason } from '../../contexts/season-context';

vi.mock('../../hooks/use-seasons', () => ({
  useSeasons: vi.fn(),
}));

import { useSeasons } from '../../hooks/use-seasons';

function TestConsumer() {
  const { seasons, seasonsLoading, seasonsError, selectedSeason, setSelectedSeason } = useSeason();

  return (
    <div>
      <span data-testid="seasons">{JSON.stringify(seasons)}</span>
      <span data-testid="loading">{seasonsLoading ? 'loading' : 'ready'}</span>
      <span data-testid="error">{seasonsError?.message ?? 'no-error'}</span>
      <span data-testid="selected">{selectedSeason ?? 'none'}</span>
      <button onClick={() => setSelectedSeason(2023)}>Set 2023</button>
    </div>
  );
}

function renderWithProvider() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SeasonProvider>
          <TestConsumer />
        </SeasonProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('SeasonContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('defaults to first season when data loads', () => {
    vi.mocked(useSeasons).mockReturnValue({
      data: { seasons: [2024, 2023, 2022] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useSeasons>);

    renderWithProvider();

    expect(screen.getByTestId('selected').textContent).toBe('2024');
    expect(screen.getByTestId('seasons').textContent).toBe('[2024,2023,2022]');
  });

  it('shows loading state while seasons are loading', () => {
    vi.mocked(useSeasons).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useSeasons>);

    renderWithProvider();

    expect(screen.getByTestId('loading').textContent).toBe('loading');
    expect(screen.getByTestId('selected').textContent).toBe('none');
  });

  it('exposes seasons error', () => {
    vi.mocked(useSeasons).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Fetch failed'),
      refetch: vi.fn(),
    } as ReturnType<typeof useSeasons>);

    renderWithProvider();

    expect(screen.getByTestId('error').textContent).toBe('Fetch failed');
  });

  it('reads selected season from sessionStorage', () => {
    sessionStorage.setItem('cfbpoll_selected_season', '2022');

    vi.mocked(useSeasons).mockReturnValue({
      data: { seasons: [2024, 2023, 2022] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useSeasons>);

    renderWithProvider();

    expect(screen.getByTestId('selected').textContent).toBe('2022');
  });

  it('setSelectedSeason updates state and sessionStorage', () => {
    vi.mocked(useSeasons).mockReturnValue({
      data: { seasons: [2024, 2023, 2022] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useSeasons>);

    renderWithProvider();

    act(() => {
      fireEvent.click(screen.getByText('Set 2023'));
    });

    expect(screen.getByTestId('selected').textContent).toBe('2023');
    expect(sessionStorage.getItem('cfbpoll_selected_season')).toBe('2023');
  });

  it('ignores invalid sessionStorage values', () => {
    sessionStorage.setItem('cfbpoll_selected_season', 'not-a-number');

    vi.mocked(useSeasons).mockReturnValue({
      data: { seasons: [2024, 2023] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useSeasons>);

    renderWithProvider();

    expect(screen.getByTestId('selected').textContent).toBe('2024');
  });

  it('throws error when useSeason is used outside SeasonProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useSeason must be used within a SeasonProvider'
    );

    consoleError.mockRestore();
  });

  it('returns empty seasons array when data is not loaded', () => {
    vi.mocked(useSeasons).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useSeasons>);

    renderWithProvider();

    expect(screen.getByTestId('seasons').textContent).toBe('[]');
  });

  it('writes default season to sessionStorage on first load', () => {
    vi.mocked(useSeasons).mockReturnValue({
      data: { seasons: [2024, 2023] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useSeasons>);

    renderWithProvider();

    expect(sessionStorage.getItem('cfbpoll_selected_season')).toBe('2024');
  });
});
