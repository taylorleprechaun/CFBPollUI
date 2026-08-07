import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePublicPredictions } from '../../hooks/use-public-predictions';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('usePublicPredictions', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('accepts optional maxSeason parameter', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ resultsPublished: false, season: 2023, week: 5, predictions: [] }),
    } as Response);

    const { result } = renderHook(() => usePublicPredictions(2023, 5, 2024), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalled();
  });

  it('changing week triggers new fetch', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ resultsPublished: false, season: 2024, week: 5, predictions: [] }),
    } as Response);

    const { result, rerender } = renderHook(
      ({ season, week }: { season: number; week: number }) =>
        usePublicPredictions(season, week),
      {
        wrapper: createWrapper(),
        initialProps: { season: 2024, week: 5 },
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ resultsPublished: false, season: 2024, week: 3, predictions: [] }),
    } as Response);

    rerender({ season: 2024, week: 3 });

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/weeks/3/'),
        undefined
      )
    );
  });

  it('does not fetch when season is null', () => {
    renderHook(() => usePublicPredictions(null, 1), { wrapper: createWrapper() });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when week is null', () => {
    renderHook(() => usePublicPredictions(2024, null), { wrapper: createWrapper() });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches when both season and week are provided', async () => {
    const mockResponse = { resultsPublished: false, season: 2024, week: 5, predictions: [] };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => usePublicPredictions(2024, 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/seasons/2024/weeks/5/predictions'),
      undefined
    );
  });

  it('returns error on fetch failure', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Predictions not found' }),
    } as Response);

    const { result } = renderHook(() => usePublicPredictions(2024, 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('returns predictions data on success', async () => {
    const mockPredictions = [
      {
        actualAwayScore: null,
        actualHomeScore: null,
        actualOverUnderResult: null,
        actualSpreadCoveringTeam: null,
        actualWinner: null,
        awayLogoURL: 'https://example.com/away.png',
        awayTeam: 'Michigan',
        awayTeamScore: 17,
        bettingOverUnder: 45.5,
        bettingSpread: -3.5,
        homeLogoURL: 'https://example.com/home.png',
        homeTeam: 'Ohio State',
        homeTeamScore: 28,
        myOverUnderPick: 'Over',
        mySpreadPick: 'Ohio State',
        neutralSite: false,
        overUnderGrade: 'Ungraded',
        predictedMargin: 11,
        predictedWinner: 'Ohio State',
        spreadGrade: 'Ungraded',
        winnerGrade: 'Ungraded',
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ resultsPublished: false, season: 2024, week: 5, predictions: mockPredictions }),
    } as Response);

    const { result } = renderHook(() => usePublicPredictions(2024, 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.predictions).toHaveLength(1);
    expect(result.current.data?.predictions[0].homeTeam).toBe('Ohio State');
  });
});
