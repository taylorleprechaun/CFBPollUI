import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSeasons, fetchWeeks, fetchRankings } from '../services/api';

describe('API service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('constructs correct URL for fetchSeasons', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ seasons: [2024, 2023, 2022] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchSeasons();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/seasons')
    );
  });

  it('constructs correct URL for fetchWeeks', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          season: 2024,
          weeks: [{ weekNumber: 1, label: 'Week 1' }],
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchWeeks(2024);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/seasons/2024/weeks')
    );
  });

  it('constructs correct URL for fetchRankings', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          season: 2024,
          week: 12,
          rankings: [],
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchRankings(2024, 12);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rankings?season=2024&week=12')
    );
  });

  it('throws error when fetchSeasons fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(fetchSeasons()).rejects.toThrow('Server error');
  });
});
