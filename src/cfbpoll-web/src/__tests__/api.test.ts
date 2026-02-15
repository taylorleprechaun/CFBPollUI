import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSeasons, fetchWeeks, fetchRankings, fetchTeamDetail } from '../services/api';

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
      expect.stringContaining('/api/v1/seasons')
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
      expect.stringContaining('/api/v1/seasons/2024/weeks')
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
      expect.stringContaining('/api/v1/rankings?season=2024&week=12')
    );
  });

  it('constructs correct URL for fetchTeamDetail', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          altColor: '#FFD700',
          color: '#006400',
          conference: 'Big Ten',
          details: {
            home: { wins: 6, losses: 0 },
            away: { wins: 4, losses: 0 },
            neutral: { wins: 1, losses: 0 },
            vsRank1To10: { wins: 2, losses: 0 },
            vsRank11To25: { wins: 3, losses: 0 },
            vsRank26To50: { wins: 1, losses: 0 },
            vsRank51To100: { wins: 2, losses: 0 },
            vsRank101Plus: { wins: 3, losses: 0 },
          },
          division: '',
          logoURL: 'https://example.com/oregon.png',
          rank: 1,
          rating: 165.42,
          record: '11-0',
          schedule: [],
          sosRanking: 15,
          teamName: 'Oregon',
          weightedSOS: 0.582,
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchTeamDetail(2024, 12, 'Oregon');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/teams/Oregon?season=2024&week=12')
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
