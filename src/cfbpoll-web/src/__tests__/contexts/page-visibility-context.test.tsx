import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../services/api', () => ({
  fetchPageVisibility: vi.fn(),
}));

vi.mock('../../lib/query-config', () => ({
  STALE_TIME_PAGE_VISIBILITY: 0,
}));

import { fetchPageVisibility } from '../../services/api';
import { PageVisibilityProvider } from '../../contexts/page-visibility-context';
import { usePageVisibility } from '../../hooks/use-page-visibility';

function TestConsumer() {
  const { allTimeEnabled, pollLeadersEnabled, seasonTrendsEnabled, isLoading } = usePageVisibility();
  return (
    <div>
      <span data-testid="all-time">{String(allTimeEnabled)}</span>
      <span data-testid="poll-leaders">{String(pollLeadersEnabled)}</span>
      <span data-testid="season-trends">{String(seasonTrendsEnabled)}</span>
      <span data-testid="loading">{String(isLoading)}</span>
    </div>
  );
}

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PageVisibilityProvider>
        <TestConsumer />
      </PageVisibilityProvider>
    </QueryClientProvider>
  );
}

describe('PageVisibilityContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides default values while loading', () => {
    vi.mocked(fetchPageVisibility).mockReturnValue(new Promise(() => {}));

    renderWithProviders();

    expect(screen.getByTestId('all-time').textContent).toBe('true');
    expect(screen.getByTestId('poll-leaders').textContent).toBe('true');
    expect(screen.getByTestId('season-trends').textContent).toBe('true');
    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('provides fetched visibility values after data loads', async () => {
    vi.mocked(fetchPageVisibility).mockResolvedValue({
      allTimeEnabled: false,
      pollLeadersEnabled: true,
      seasonTrendsEnabled: false,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('all-time').textContent).toBe('false');
    expect(screen.getByTestId('poll-leaders').textContent).toBe('true');
    expect(screen.getByTestId('season-trends').textContent).toBe('false');
  });

  it('handles fetch error gracefully with defaults of true', async () => {
    vi.mocked(fetchPageVisibility).mockRejectedValue(new Error('Network error'));

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('all-time').textContent).toBe('true');
    expect(screen.getByTestId('poll-leaders').textContent).toBe('true');
    expect(screen.getByTestId('season-trends').textContent).toBe('true');
  });
});
