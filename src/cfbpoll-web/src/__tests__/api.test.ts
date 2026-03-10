import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSeasons, fetchWeeks, fetchRankings, fetchConferences, fetchTeamDetail, fetchPageVisibility, fetchPollLeaders } from '../services/api';

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
      expect.stringContaining('/api/v1/seasons'),
      undefined
    );
  });

  it('constructs correct URL for fetchWeeks', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          season: 2024,
          weeks: [{ weekNumber: 1, label: 'Week 1', rankingsPublished: false }],
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchWeeks(2024);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/seasons/2024/weeks'),
      undefined
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
      expect.stringContaining('/api/v1/seasons/2024/weeks/12/rankings'),
      undefined
    );
  });

  it('constructs correct URL for fetchConferences', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          conferences: [{ id: 1, label: 'ACC', name: 'Atlantic Coast Conference' }],
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchConferences();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/conferences'),
      undefined
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
          logoURL: 'https://example.com/usc.png',
          rank: 1,
          rating: 165.42,
          record: '11-0',
          schedule: [],
          sosRanking: 15,
          teamName: 'USC',
          weightedSOS: 0.582,
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchTeamDetail(2024, 12, 'USC');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/teams/USC?season=2024&week=12'),
      undefined
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

  describe('fetchPageVisibility', () => {
    it('calls correct URL and validates response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ allTimeEnabled: true, pollLeadersEnabled: false, seasonTrendsEnabled: true }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await fetchPageVisibility();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/page-visibility'),
        undefined
      );
      expect(result.allTimeEnabled).toBe(true);
      expect(result.pollLeadersEnabled).toBe(false);
    });

    it('throws on failed fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(fetchPageVisibility()).rejects.toThrow('Server error');
    });
  });

  describe('fetchPollLeaders', () => {
    it('calls correct URL with no params', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            allWeeks: [],
            finalWeeksOnly: [],
            maxAvailableSeason: 2024,
            minAvailableSeason: 2002,
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await fetchPollLeaders();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/poll-leaders'),
        undefined
      );
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('?');
    });

    it('includes both params in query string', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            allWeeks: [],
            finalWeeksOnly: [],
            maxAvailableSeason: 2024,
            minAvailableSeason: 2010,
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await fetchPollLeaders(2010, 2024);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('minSeason=2010');
      expect(calledUrl).toContain('maxSeason=2024');
    });

    it('includes only minSeason when maxSeason is undefined', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            allWeeks: [],
            finalWeeksOnly: [],
            maxAvailableSeason: 2024,
            minAvailableSeason: 2015,
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await fetchPollLeaders(2015);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('minSeason=2015');
      expect(calledUrl).not.toContain('maxSeason');
    });

    it('includes only maxSeason when minSeason is undefined', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            allWeeks: [],
            finalWeeksOnly: [],
            maxAvailableSeason: 2020,
            minAvailableSeason: 2002,
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await fetchPollLeaders(undefined, 2020);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('minSeason');
      expect(calledUrl).toContain('maxSeason=2020');
    });

    it('throws on failed fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal error' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(fetchPollLeaders()).rejects.toThrow('Internal error');
    });
  });
});
