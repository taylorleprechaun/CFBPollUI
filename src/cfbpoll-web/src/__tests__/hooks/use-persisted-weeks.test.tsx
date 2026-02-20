import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePersistedWeeks } from '../../hooks/use-persisted-weeks';

vi.mock('../../services/admin-api', () => ({
  fetchPersistedWeeks: vi.fn(),
}));

import { fetchPersistedWeeks } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('usePersistedWeeks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => usePersistedWeeks(null), { wrapper: createWrapper() });

    expect(fetchPersistedWeeks).not.toHaveBeenCalled();
  });

  it('fetches when token is provided', async () => {
    const mockData = [
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
    ];
    vi.mocked(fetchPersistedWeeks).mockResolvedValue(mockData);

    const { result } = renderHook(() => usePersistedWeeks('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchPersistedWeeks).toHaveBeenCalledWith('test-token');
    expect(result.current.data).toEqual(mockData);
  });

  it('returns error on fetch failure', async () => {
    vi.mocked(fetchPersistedWeeks).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => usePersistedWeeks('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
