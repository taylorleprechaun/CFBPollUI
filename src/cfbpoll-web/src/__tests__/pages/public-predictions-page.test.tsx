import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { PublicPredictionsPage } from '../../pages/public-predictions-page';
import { ApiError } from '../../lib/api-error';

const mockSetSelectedSeason = vi.fn();

vi.mock('../../hooks/use-season', () => ({
  useSeason: () => ({
    seasons: [2024, 2023],
    seasonsLoading: false,
    seasonsError: null,
    selectedSeason: 2024,
    setSelectedSeason: mockSetSelectedSeason,
    refetchSeasons: vi.fn(),
  }),
}));

let mockPredictionSeasonsData: { seasons: number[] } | undefined;
let mockPredictionSeasonsLoading = false;
let mockPredictionSeasonsError: Error | null = null;
const mockRefetchPredictionSeasons = vi.fn();

vi.mock('../../hooks/use-prediction-seasons', () => ({
  usePredictionSeasons: () => ({
    data: mockPredictionSeasonsData,
    isLoading: mockPredictionSeasonsLoading,
    error: mockPredictionSeasonsError,
    refetch: mockRefetchPredictionSeasons,
  }),
}));

let mockWeeksData: { season: number; weeks: { weekNumber: number; label: string; predictionsPublished: boolean; rankingsPublished: boolean }[] } | undefined;
let mockWeeksLoading = false;
let mockWeeksError: Error | null = null;
const mockRefetchWeeks = vi.fn();

vi.mock('../../hooks/use-weeks', () => ({
  useWeeks: () => ({
    data: mockWeeksData,
    isLoading: mockWeeksLoading,
    error: mockWeeksError,
    refetch: mockRefetchWeeks,
  }),
}));

let mockPredictionsData: { season: number; week: number; predictions: unknown[]; resultsPublished?: boolean } | undefined;
let mockPredictionsLoading = false;
let mockPredictionsError: Error | null = null;
const mockRefetchPredictions = vi.fn();

vi.mock('../../hooks/use-public-predictions', () => ({
  usePublicPredictions: () => ({
    data: mockPredictionsData,
    isLoading: mockPredictionsLoading,
    error: mockPredictionsError,
    refetch: mockRefetchPredictions,
  }),
}));

let mockRankingsData: { season: number; week: number; rankings: { teamName: string; rank: number }[] } | undefined;

vi.mock('../../hooks/use-rankings', () => ({
  useRankings: () => ({
    data: mockRankingsData,
  }),
}));

vi.mock('../../hooks/use-document-title', () => ({
  useDocumentTitle: vi.fn(),
}));

function renderPage(initialRoute = '/predictions') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <PublicPredictionsPage />
    </MemoryRouter>
  );
}

describe('PublicPredictionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWeeksData = {
      season: 2024,
      weeks: [
        { weekNumber: 1, label: 'Week 2', predictionsPublished: true, rankingsPublished: true },
        { weekNumber: 5, label: 'Week 6', predictionsPublished: false, rankingsPublished: true },
      ],
    };
    mockWeeksLoading = false;
    mockWeeksError = null;
    mockPredictionSeasonsData = { seasons: [2024, 2023] };
    mockPredictionSeasonsLoading = false;
    mockPredictionSeasonsError = null;
    mockPredictionsData = undefined;
    mockPredictionsLoading = false;
    mockPredictionsError = null;
    mockRankingsData = undefined;
  });

  it('renders heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Predictions' })).toBeInTheDocument();
  });

  it('only lists seasons with published predictions in the season dropdown', () => {
    mockPredictionSeasonsData = { seasons: [2024] };

    renderPage();

    const seasonSelect = screen.getByLabelText('Season:') as HTMLSelectElement;
    const optionValues = Array.from(seasonSelect.options).map((o) => o.value);
    expect(optionValues).toEqual(['2024']);
  });

  it('falls back to the latest published prediction season when the globally selected season has none', () => {
    mockPredictionSeasonsData = { seasons: [2023] };

    renderPage();

    const seasonSelect = screen.getByLabelText('Season:') as HTMLSelectElement;
    expect(seasonSelect.value).toBe('2023');
  });

  it('shows an empty-season message when no weeks have published predictions', () => {
    mockWeeksData = {
      season: 2024,
      weeks: [{ weekNumber: 1, label: 'Week 2', predictionsPublished: false, rankingsPublished: true }],
    };

    renderPage();

    expect(screen.getByText('No predictions have been published for this season yet.')).toBeInTheDocument();
  });

  it('shows a not-yet-published message when the selected week 404s', () => {
    mockPredictionsError = new ApiError('Predictions not found', 404);

    renderPage();

    expect(screen.getByText('No predictions have been published for this week yet.')).toBeInTheDocument();
  });

  it('renders the predictions table when data is available', () => {
    mockPredictionsData = {
      season: 2024,
      week: 1,
      predictions: [
        {
          awayLogoURL: '',
          awayTeam: 'Michigan',
          awayTeamScore: 17,
          bettingOverUnder: 45.5,
          bettingSpread: -3.5,
          homeLogoURL: '',
          homeTeam: 'Ohio State',
          homeTeamScore: 28,
          myOverUnderPick: 'Over',
          mySpreadPick: 'Ohio State',
          neutralSite: false,
          predictedMargin: 11,
          predictedWinner: 'Ohio State',
        },
      ],
    };

    renderPage();

    expect(screen.getAllByText('Ohio State').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Michigan').length).toBeGreaterThan(0);
  });

  it('links team names to the currently selected season', () => {
    mockPredictionsData = {
      season: 2024,
      week: 1,
      predictions: [
        {
          awayLogoURL: '',
          awayTeam: 'Michigan',
          awayTeamScore: 17,
          bettingOverUnder: 45.5,
          bettingSpread: -3.5,
          homeLogoURL: '',
          homeTeam: 'Ohio State',
          homeTeamScore: 28,
          myOverUnderPick: 'Over',
          mySpreadPick: 'Ohio State',
          neutralSite: false,
          predictedMargin: 11,
          predictedWinner: 'Ohio State',
        },
      ],
    };

    renderPage();

    const michiganLinks = screen.getAllByRole('link', { name: 'Michigan' });
    expect(michiganLinks.length).toBeGreaterThan(0);
    for (const link of michiganLinks) {
      expect(link).toHaveAttribute(
        'href',
        `/team-details?team=${encodeURIComponent('Michigan')}&season=2024`
      );
    }
  });

  it('shows an inline rank badge next to a team name that is ranked in the top 25', () => {
    mockPredictionsData = {
      season: 2024,
      week: 1,
      predictions: [
        {
          awayLogoURL: '',
          awayTeam: 'Michigan',
          awayTeamScore: 17,
          bettingOverUnder: 45.5,
          bettingSpread: -3.5,
          homeLogoURL: '',
          homeTeam: 'Ohio State',
          homeTeamScore: 28,
          myOverUnderPick: 'Over',
          mySpreadPick: 'Ohio State',
          neutralSite: false,
          predictedMargin: 11,
          predictedWinner: 'Ohio State',
        },
      ],
    };
    mockRankingsData = {
      season: 2024,
      week: 1,
      rankings: [{ teamName: 'Ohio State', rank: 3 }],
    };

    renderPage();

    const michiganLinks = screen.getAllByRole('link', { name: 'Michigan' });
    expect(michiganLinks.length).toBeGreaterThan(0);
    for (const link of michiganLinks) {
      expect(link.textContent).toBe('Michigan');
    }

    const ohioStateLinks = screen.getAllByRole('link', { name: /Ohio State/ });
    expect(ohioStateLinks.length).toBeGreaterThan(0);
    for (const link of ohioStateLinks) {
      expect(link.textContent).toBe('#3 Ohio State');
    }
  });

  describe('Top 25 Only filter', () => {
    beforeEach(() => {
      mockPredictionsData = {
        season: 2024,
        week: 1,
        predictions: [
          {
            awayLogoURL: '',
            awayTeam: 'Michigan',
            awayTeamScore: 17,
            bettingOverUnder: 45.5,
            bettingSpread: -3.5,
            homeLogoURL: '',
            homeTeam: 'Ohio State',
            homeTeamScore: 28,
            myOverUnderPick: 'Over',
            mySpreadPick: 'Ohio State',
            neutralSite: false,
            predictedMargin: 11,
            predictedWinner: 'Ohio State',
          },
          {
            awayLogoURL: '',
            awayTeam: 'Nebraska',
            awayTeamScore: 14,
            bettingOverUnder: 40,
            bettingSpread: -7,
            homeLogoURL: '',
            homeTeam: 'Iowa',
            homeTeamScore: 21,
            myOverUnderPick: 'Under',
            mySpreadPick: 'Iowa',
            neutralSite: false,
            predictedMargin: 7,
            predictedWinner: 'Iowa',
          },
        ],
      };
      mockRankingsData = {
        season: 2024,
        week: 1,
        rankings: [{ teamName: 'Ohio State', rank: 3 }],
      };
    });

    it('hides games where neither team is ranked in the top 25 once toggled on', async () => {
      renderPage();

      expect(screen.getAllByText('Nebraska').length).toBeGreaterThan(0);

      await userEvent.click(screen.getByRole('button', { name: 'Top 25' }));

      expect(screen.queryByText('Nebraska')).not.toBeInTheDocument();
      expect(screen.queryByText('Iowa')).not.toBeInTheDocument();
      expect(screen.getAllByText('Michigan').length).toBeGreaterThan(0);
    });

    it('shows all games again when toggled off', async () => {
      renderPage();

      const toggle = screen.getByRole('button', { name: 'Top 25' });
      await userEvent.click(toggle);
      expect(screen.queryByText('Nebraska')).not.toBeInTheDocument();

      await userEvent.click(toggle);
      expect(screen.getAllByText('Nebraska').length).toBeGreaterThan(0);
    });

    it('marks the toggle as pressed only while the filter is active', async () => {
      renderPage();

      const toggle = screen.getByRole('button', { name: 'Top 25' });
      expect(toggle).toHaveAttribute('aria-pressed', 'false');

      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows a message instead of an empty table when no games involve a ranked team', async () => {
      mockRankingsData = { season: 2024, week: 1, rankings: [] };
      renderPage();

      await userEvent.click(screen.getByRole('button', { name: 'Top 25' }));

      expect(screen.getByText('No Top 25 matchups this week.')).toBeInTheDocument();
      expect(screen.queryByText('Score')).not.toBeInTheDocument();
    });

    it('shows the table again when Top 25 is toggled off after showing the no-matchups message', async () => {
      mockRankingsData = { season: 2024, week: 1, rankings: [] };
      renderPage();

      const toggle = screen.getByRole('button', { name: 'Top 25' });
      await userEvent.click(toggle);
      expect(screen.getByText('No Top 25 matchups this week.')).toBeInTheDocument();

      await userEvent.click(toggle);
      expect(screen.queryByText('No Top 25 matchups this week.')).not.toBeInTheDocument();
      expect(screen.getAllByText('Nebraska').length).toBeGreaterThan(0);
    });
  });

  it('shows a loading skeleton while predictions are fetching', () => {
    mockPredictionsLoading = true;

    renderPage();

    expect(screen.queryByText('No predictions have been published for this week yet.')).not.toBeInTheDocument();
    expect(screen.queryByText('Score')).not.toBeInTheDocument();
  });

  it('renders a generic error alert for non-404 errors', () => {
    mockPredictionsError = new ApiError('Server error', 500);

    renderPage();

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows the season/week caption once predictions load', () => {
    mockPredictionsData = { season: 2024, week: 1, predictions: [] };

    renderPage();

    expect(screen.getByText(/Showing predictions for 2024 Season/)).toBeInTheDocument();
  });

  it('does not show graded styling when results are published but not graded', () => {
    mockPredictionsData = {
      season: 2024,
      week: 1,
      resultsPublished: false,
      predictions: [
        {
          actualAwayScore: null,
          actualHomeScore: null,
          actualOverUnderResult: null,
          actualSpreadCoveringTeam: null,
          actualWinner: null,
          awayLogoURL: '',
          awayTeam: 'Michigan',
          awayTeamScore: 17,
          bettingOverUnder: 45.5,
          bettingSpread: -3.5,
          homeLogoURL: '',
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
      ],
    };

    renderPage();

    expect(screen.queryByText(/Final:/)).not.toBeInTheDocument();
  });

  it('shows graded styling when results are graded and published', () => {
    mockPredictionsData = {
      season: 2024,
      week: 1,
      resultsPublished: true,
      predictions: [
        {
          actualAwayScore: 17,
          actualHomeScore: 28,
          actualOverUnderResult: 'Under',
          actualSpreadCoveringTeam: 'Ohio State',
          actualWinner: 'Ohio State',
          awayLogoURL: '',
          awayTeam: 'Michigan',
          awayTeamScore: 17,
          bettingOverUnder: 45.5,
          bettingSpread: -3.5,
          homeLogoURL: '',
          homeTeam: 'Ohio State',
          homeTeamScore: 28,
          myOverUnderPick: 'Over',
          mySpreadPick: 'Ohio State',
          neutralSite: false,
          overUnderGrade: 'Correct',
          predictedMargin: 11,
          predictedWinner: 'Ohio State',
          spreadGrade: 'Correct',
          winnerGrade: 'Correct',
        },
      ],
    };

    renderPage();

    expect(
      screen.getAllByText((_, element) => element?.textContent === 'Final: 17-28').length
    ).toBeGreaterThan(0);
  });

  it('resets the selected week when the season changes', async () => {
    mockWeeksData = {
      season: 2024,
      weeks: [
        { weekNumber: 1, label: 'Week 2', predictionsPublished: true, rankingsPublished: true },
        { weekNumber: 5, label: 'Week 6', predictionsPublished: true, rankingsPublished: true },
      ],
    };

    renderPage();

    const weekSelect = screen.getByLabelText('Week:') as HTMLSelectElement;
    expect(weekSelect.value).toBe('5');

    await userEvent.selectOptions(weekSelect, '1');
    expect(weekSelect.value).toBe('1');

    await userEvent.selectOptions(screen.getByLabelText('Season:'), '2023');

    expect(weekSelect.value).toBe('5');
  });

  it('retries only the seasons query when only it has errored', async () => {
    mockPredictionSeasonsError = new Error('Seasons failed');

    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(mockRefetchPredictionSeasons).toHaveBeenCalledTimes(1);
    expect(mockRefetchWeeks).not.toHaveBeenCalled();
    expect(mockRefetchPredictions).not.toHaveBeenCalled();
  });

  it('retries only the weeks query when only it has errored', async () => {
    mockWeeksError = new Error('Weeks failed');

    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(mockRefetchWeeks).toHaveBeenCalledTimes(1);
    expect(mockRefetchPredictionSeasons).not.toHaveBeenCalled();
    expect(mockRefetchPredictions).not.toHaveBeenCalled();
  });

  it('retries only the predictions query when only it has errored', async () => {
    mockPredictionsError = new ApiError('Server error', 500);

    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(mockRefetchPredictions).toHaveBeenCalledTimes(1);
    expect(mockRefetchPredictionSeasons).not.toHaveBeenCalled();
    expect(mockRefetchWeeks).not.toHaveBeenCalled();
  });

  describe('URL parameter handling', () => {
    it('calls setSelectedSeason with the URL season param on mount', () => {
      renderPage('/predictions?season=2023');

      expect(mockSetSelectedSeason).toHaveBeenCalledWith(2023);
    });

    it('does not call setSelectedSeason when no season param is present', () => {
      renderPage();

      expect(mockSetSelectedSeason).not.toHaveBeenCalled();
    });

    it('sets the week selector to the URL week param once the published weeks load', () => {
      mockWeeksData = {
        season: 2024,
        weeks: [
          { weekNumber: 1, label: 'Week 2', predictionsPublished: true, rankingsPublished: true },
          { weekNumber: 5, label: 'Week 6', predictionsPublished: true, rankingsPublished: true },
        ],
      };

      renderPage('/predictions?week=1');

      const weekSelect = screen.getByLabelText('Week:') as HTMLSelectElement;
      expect(weekSelect.value).toBe('1');
    });

    it('ignores a week param that does not match a published week and keeps the default', () => {
      mockWeeksData = {
        season: 2024,
        weeks: [
          { weekNumber: 1, label: 'Week 2', predictionsPublished: true, rankingsPublished: true },
          { weekNumber: 5, label: 'Week 6', predictionsPublished: true, rankingsPublished: true },
        ],
      };

      renderPage('/predictions?week=99');

      const weekSelect = screen.getByLabelText('Week:') as HTMLSelectElement;
      expect(weekSelect.value).toBe('5');
    });
  });
});
