import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

let mockWeeksData: { season: number; weeks: { weekNumber: number; label: string; predictionsPublished: boolean; rankingsPublished: boolean }[] } | undefined;
let mockWeeksLoading = false;

vi.mock('../../hooks/use-weeks', () => ({
  useWeeks: () => ({
    data: mockWeeksData,
    isLoading: mockWeeksLoading,
    error: null,
    refetch: vi.fn(),
  }),
}));

let mockPredictionsData: { season: number; week: number; predictions: unknown[]; resultsPublished?: boolean } | undefined;
let mockPredictionsLoading = false;
let mockPredictionsError: Error | null = null;

vi.mock('../../hooks/use-public-predictions', () => ({
  usePublicPredictions: () => ({
    data: mockPredictionsData,
    isLoading: mockPredictionsLoading,
    error: mockPredictionsError,
    refetch: vi.fn(),
  }),
}));

vi.mock('../../hooks/use-document-title', () => ({
  useDocumentTitle: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
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
    mockPredictionsData = undefined;
    mockPredictionsLoading = false;
    mockPredictionsError = null;
  });

  it('renders heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Predictions' })).toBeInTheDocument();
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
    expect(screen.getByText('Michigan')).toBeInTheDocument();
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

    expect(screen.getByText((_, element) => element?.textContent === 'Final: 17-28')).toBeInTheDocument();
  });
});
