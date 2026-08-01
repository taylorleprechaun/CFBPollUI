import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PredictionsPage } from '../../pages/predictions-page';

let mockToken: string | null = 'test-token';

const mockSetSelectedSeason = vi.fn();

vi.mock('../../hooks/use-auth', () => ({
  useAuth: () => ({
    isAuthenticated: mockToken !== null,
    login: vi.fn(),
    logout: vi.fn(),
    token: mockToken,
  }),
}));

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

vi.mock('../../hooks/use-weeks', () => ({
  useWeeks: () => ({
    data: {
      season: 2024,
      weeks: [
        { weekNumber: 1, label: 'Week 2' },
        { weekNumber: 5, label: 'Week 6' },
      ],
    },
    isLoading: false,
  }),
}));

const mockCalculateMutateAsync = vi.fn();
const mockPublishMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockRefreshCacheMutateAsync = vi.fn();
const mockGradeMutateAsync = vi.fn();
const mockPublishResultsMutateAsync = vi.fn();
let mockCalculateIsPending = false;
let mockRefreshCacheIsPending = false;
let mockGradeIsPending = false;
let mockPublishResultsIsPending = false;

vi.mock('../../hooks/use-admin-mutations', () => ({
  useCalculatePredictions: () => ({
    mutateAsync: mockCalculateMutateAsync,
    isPending: mockCalculateIsPending,
  }),
  usePublishPredictions: () => ({
    mutateAsync: mockPublishMutateAsync,
    isPending: false,
  }),
  useDeletePredictions: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  useRefreshCache: () => ({
    mutateAsync: mockRefreshCacheMutateAsync,
    isPending: mockRefreshCacheIsPending,
  }),
  useGradePredictions: () => ({
    mutateAsync: mockGradeMutateAsync,
    isPending: mockGradeIsPending,
  }),
  usePublishGradedResults: () => ({
    mutateAsync: mockPublishResultsMutateAsync,
    isPending: mockPublishResultsIsPending,
  }),
}));

let mockSummariesData:
  | { season: number; week: number; isPublished: boolean; createdAt: string; gameCount: number; gradedAt: string | null; isGraded: boolean; resultsPublished: boolean }[]
  | undefined = [];
let mockSummariesError: Error | null = null;
const mockRefetchSummaries = vi.fn();

vi.mock('../../hooks/use-predictions-summaries', () => ({
  usePredictionsSummaries: () => ({
    data: mockSummariesData,
    error: mockSummariesError,
    isLoading: false,
    refetch: mockRefetchSummaries,
  }),
}));

vi.mock('../../hooks/use-page-visibility', () => ({
  usePageVisibility: () => ({
    allTimeEnabled: true,
    isLoading: false,
    pollLeadersEnabled: true,
    seasonTrendsEnabled: true,
  }),
}));

interface MockPredictionsResponse {
  isGraded: boolean;
  predictions: unknown[];
  resultsPublished: boolean;
  season: number;
  week: number;
}

interface MockActiveView {
  isGraded: boolean;
  isPersisted: boolean | null;
  isPublished: boolean | null;
  predictions: MockPredictionsResponse;
  resultsPublished: boolean;
  season: number;
  source: 'calculated' | 'graded' | 'viewed';
  unmatchedGameCount: number | null;
  week: number;
}

// Real useState is used here (not a plain mutable variable) so that showView, which has no
// sibling setState call in predictions-page.tsx to piggyback a re-render on, still triggers one.
vi.mock('../../hooks/use-predictions-active-view', () => ({
  usePredictionsActiveView: () => {
    const [view, setView] = useState<MockActiveView | null>(null);

    return {
      applyCalculated: (result: { isPersisted: boolean; predictions: MockPredictionsResponse }) => {
        setView({
          isGraded: result.predictions.isGraded,
          isPersisted: result.isPersisted,
          isPublished: null,
          predictions: result.predictions,
          resultsPublished: result.predictions.resultsPublished,
          season: result.predictions.season,
          source: 'calculated',
          unmatchedGameCount: null,
          week: result.predictions.week,
        });
      },
      applyGraded: (result: { isPersisted: boolean; predictions: MockPredictionsResponse; unmatchedGameCount: number }) => {
        setView({
          isGraded: result.predictions.isGraded,
          isPersisted: result.isPersisted,
          isPublished: null,
          predictions: result.predictions,
          resultsPublished: result.predictions.resultsPublished,
          season: result.predictions.season,
          source: 'graded',
          unmatchedGameCount: result.unmatchedGameCount,
          week: result.predictions.week,
        });
      },
      clearIfMatches: (season: number, week: number) => {
        setView((prev) => (prev && prev.season === season && prev.week === week ? null : prev));
      },
      error: null,
      isLoading: false,
      season: view?.season ?? null,
      showView: (season: number, week: number) => {
        setView({
          isGraded: true,
          isPersisted: null,
          isPublished: true,
          predictions: { isGraded: true, predictions: [], resultsPublished: false, season, week },
          resultsPublished: false,
          season,
          source: 'viewed',
          unmatchedGameCount: null,
          week,
        });
      },
      view,
      week: view?.week ?? null,
    };
  },
}));

function renderPredictionsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PredictionsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const gradedGamePrediction = {
  actualAwayScore: 17,
  actualHomeScore: 28,
  actualOverUnderResult: 'Under',
  actualSpreadCoveringTeam: 'Ohio State',
  actualWinner: 'Ohio State',
  awayLogoURL: 'https://example.com/michigan.png',
  awayTeam: 'Michigan',
  awayTeamScore: 17,
  bettingOverUnder: 48.5,
  bettingSpread: -7.5,
  homeLogoURL: 'https://example.com/ohiostate.png',
  homeTeam: 'Ohio State',
  homeTeamScore: 28,
  myOverUnderPick: 'Under',
  mySpreadPick: 'Ohio State',
  neutralSite: false,
  overUnderGrade: 'Correct',
  predictedMargin: 10.5,
  predictedWinner: 'Ohio State',
  spreadGrade: 'Correct',
  winnerGrade: 'Correct',
};

describe('PredictionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'test-token';
    mockSummariesData = [];
    mockSummariesError = null;
    mockCalculateIsPending = false;
    mockRefreshCacheIsPending = false;
    mockGradeIsPending = false;
    mockPublishResultsIsPending = false;
  });

  it('renders heading', () => {
    renderPredictionsPage();
    expect(screen.getByRole('heading', { name: 'Predictions' })).toBeInTheDocument();
  });

  it('renders generate predictions section', () => {
    renderPredictionsPage();
    expect(screen.getByText('Generate Predictions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
  });

  it('renders empty persisted predictions section', () => {
    renderPredictionsPage();
    expect(screen.getByText('Persisted Predictions')).toBeInTheDocument();
    expect(screen.getByText('No persisted predictions found.')).toBeInTheDocument();
  });

  it('calls calculate mutation on Generate click', async () => {
    const user = userEvent.setup();
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: { isGraded: false, resultsPublished: false, season: 2024, week: 1, predictions: [] },
    });

    renderPredictionsPage();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
  });

  it('shows an inline banner with a View button when the selected week already has predictions', () => {
    mockSummariesData = [
      { season: 2024, week: 5, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: '2024-09-02T00:00:00Z', isGraded: true, resultsPublished: true },
    ];

    renderPredictionsPage();

    const banner = screen.getByText(/already has results published predictions/).closest('div')!;
    expect(within(banner).getByRole('button', { name: 'View' })).toBeInTheDocument();
  });

  it('does not show the inline banner when nothing exists for the selected week', () => {
    renderPredictionsPage();

    expect(screen.queryByText(/already has/)).not.toBeInTheDocument();
  });

  it('hides the inline banner once its View button has loaded that week into the active view', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 5, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
    ];

    renderPredictionsPage();
    const banner = screen.getByText(/already has picks published predictions/).closest('div')!;

    await user.click(within(banner).getByRole('button', { name: 'View' }));

    await waitFor(() => {
      expect(screen.getByText('Score')).toBeInTheDocument();
    });
    expect(screen.queryByText(/already has/)).not.toBeInTheDocument();
  });

  it('does not confirm before generating over a plain unpublished draft', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 5, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
    ];
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: { isGraded: false, resultsPublished: false, season: 2024, week: 5, predictions: [] },
    });

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(screen.queryByText('Overwrite Existing Predictions')).not.toBeInTheDocument();
    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
  });

  it('confirms before generating over an already-graded week and describes its state', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 5, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: '2024-09-02T00:00:00Z', isGraded: true, resultsPublished: false },
    ];

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Overwrite Existing Predictions')).toBeInTheDocument();
    expect(within(dialog).getByText(/status of Graded/)).toBeInTheDocument();
  });

  it('generates after confirming the overwrite', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 5, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: '2024-09-02T00:00:00Z', isGraded: true, resultsPublished: false },
    ];
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: { isGraded: false, resultsPublished: false, season: 2024, week: 5, predictions: [] },
    });

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Generate' }));

    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
  });

  it('does not generate when the overwrite confirmation is cancelled', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 5, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: '2024-09-02T00:00:00Z', isGraded: true, resultsPublished: false },
    ];

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('shows active view section after successful generation', async () => {
    const user = userEvent.setup();
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: {
        isGraded: false,
        resultsPublished: false,
        season: 2024,
        week: 1,
        predictions: [
          {
            actualAwayScore: null,
            actualHomeScore: null,
            actualOverUnderResult: null,
            actualSpreadCoveringTeam: null,
            actualWinner: null,
            awayLogoURL: 'https://example.com/michigan.png',
            awayTeam: 'Michigan',
            awayTeamScore: 17,
            bettingOverUnder: 48.5,
            bettingSpread: -7.5,
            homeLogoURL: 'https://example.com/ohiostate.png',
            homeTeam: 'Ohio State',
            homeTeamScore: 28,
            myOverUnderPick: 'Under',
            mySpreadPick: 'Ohio State',
            neutralSite: false,
            overUnderGrade: 'Ungraded',
            predictedMargin: 10.5,
            predictedWinner: 'Ohio State',
            spreadGrade: 'Ungraded',
            winnerGrade: 'Ungraded',
          },
        ],
      },
    });

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => {
      expect(screen.getAllByText('Michigan').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Ohio State').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows error alert on calculate failure', async () => {
    const user = userEvent.setup();
    mockCalculateMutateAsync.mockRejectedValue(new Error('Server error'));

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('renders persisted summaries when data exists', () => {
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      { season: 2024, week: 2, isPublished: false, createdAt: '2024-09-08T00:00:00Z', gameCount: 8, gradedAt: null, isGraded: false, resultsPublished: false },
    ];

    renderPredictionsPage();
    expect(screen.getByText('2024 Season')).toBeInTheDocument();
  });

  it('shows error when summaries fail to load', () => {
    mockSummariesError = new Error('DB error');

    renderPredictionsPage();
    expect(screen.getByText('DB error')).toBeInTheDocument();
  });

  it('shows confirm modal for deleting published predictions', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
    ];

    renderPredictionsPage();

    const seasonButton = screen.getByRole('button', { name: /2024 Season/i });
    await user.click(seasonButton);

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete Published Predictions')).toBeInTheDocument();
    });
  });

  it('publishes predictions from active view section', async () => {
    const user = userEvent.setup();
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: {
        isGraded: false,
        resultsPublished: false,
        season: 2024,
        week: 5,
        predictions: [
          {
            actualAwayScore: null,
            actualHomeScore: null,
            actualOverUnderResult: null,
            actualSpreadCoveringTeam: null,
            actualWinner: null,
            awayLogoURL: 'https://example.com/nebraska.png',
            awayTeam: 'Nebraska',
            awayTeamScore: 14,
            bettingOverUnder: 45.0,
            bettingSpread: -10.0,
            homeLogoURL: 'https://example.com/texas.png',
            homeTeam: 'Texas',
            homeTeamScore: 31,
            myOverUnderPick: 'Over',
            mySpreadPick: 'Texas',
            neutralSite: false,
            overUnderGrade: 'Ungraded',
            predictedMargin: 17.0,
            predictedWinner: 'Texas',
            spreadGrade: 'Ungraded',
            winnerGrade: 'Ungraded',
          },
        ],
      },
    });
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => {
      expect(screen.getAllByText('Texas').length).toBeGreaterThanOrEqual(1);
    });

    const publishButton = screen.getByRole('button', { name: 'Publish' });
    await user.click(publishButton);

    expect(mockPublishMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
  });

  it('confirms delete in modal and calls delete mutation', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
    ];
    mockDeleteMutateAsync.mockResolvedValue(undefined);

    renderPredictionsPage();

    const seasonButton = screen.getByRole('button', { name: /2024 Season/i });
    await user.click(seasonButton);

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete Published Predictions')).toBeInTheDocument();
    });

    const modal = screen.getByRole('dialog');
    const confirmDeleteButton = within(modal).getByRole('button', { name: 'Delete' });
    await user.click(confirmDeleteButton);

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
  });

  it('publishes predictions from persisted section', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderPredictionsPage();

    const seasonButton = screen.getByRole('button', { name: /2024 Season/i });
    await user.click(seasonButton);

    const publishButton = screen.getByRole('button', { name: 'Publish' });
    await user.click(publishButton);

    expect(mockPublishMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
  });

  it('shows View button on a persisted row and loads it into the active view without calling calculate or grade', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: true, resultsPublished: false },
    ];

    renderPredictionsPage();

    const seasonButton = screen.getByRole('button', { name: /2024 Season/i });
    await user.click(seasonButton);

    const viewButton = screen.getByRole('button', { name: 'View' });
    await user.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Score')).toBeInTheDocument();
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
    expect(mockGradeMutateAsync).not.toHaveBeenCalled();
  });

  it('syncs the season/week selectors to the viewed week so Generate and Grade no longer target the default week', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: true, resultsPublished: false },
    ];
    mockGradeMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: { isGraded: true, resultsPublished: false, season: 2024, week: 1, predictions: [] },
      unmatchedGameCount: 0,
    });

    renderPredictionsPage();

    // Defaults to the last week in the mocked list (week 5) before any view is loaded.
    await user.click(screen.getByRole('button', { name: 'Grade' }));
    expect(mockGradeMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    mockGradeMutateAsync.mockClear();

    const seasonButton = screen.getByRole('button', { name: /2024 Season/i });
    await user.click(seasonButton);
    await user.click(screen.getByRole('button', { name: 'View' }));

    await waitFor(() => {
      expect(screen.getByText('Score')).toBeInTheDocument();
    });

    // Grade should now act on the viewed week (1), not the stale default (5).
    await user.click(screen.getByRole('button', { name: 'Grade' }));
    expect(mockGradeMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
  });

  it('allows manually changing the week selector after a view loads without it snapping back', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: true, resultsPublished: false },
    ];
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: { isGraded: false, resultsPublished: false, season: 2024, week: 5, predictions: [] },
    });

    renderPredictionsPage();

    const seasonButton = screen.getByRole('button', { name: /2024 Season/i });
    await user.click(seasonButton);
    await user.click(screen.getByRole('button', { name: 'View' }));

    await waitFor(() => {
      expect(screen.getByText('Score')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Week')).toHaveValue('1');

    await user.selectOptions(screen.getByLabelText('Week'), '5');
    expect(screen.getByLabelText('Week')).toHaveValue('5');

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
  });

  it('clears active view when matching persisted prediction is deleted', async () => {
    const user = userEvent.setup();
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: {
        isGraded: false,
        resultsPublished: false,
        season: 2024,
        week: 1,
        predictions: [
          {
            actualAwayScore: null,
            actualHomeScore: null,
            actualOverUnderResult: null,
            actualSpreadCoveringTeam: null,
            actualWinner: null,
            awayLogoURL: 'https://example.com/iowa.png',
            awayTeam: 'Iowa',
            awayTeamScore: 10,
            bettingOverUnder: 40.0,
            bettingSpread: -3.5,
            homeLogoURL: 'https://example.com/nebraska.png',
            homeTeam: 'Nebraska',
            homeTeamScore: 14,
            myOverUnderPick: 'Under',
            mySpreadPick: 'Nebraska',
            neutralSite: false,
            overUnderGrade: 'Ungraded',
            predictedMargin: 4.0,
            predictedWinner: 'Nebraska',
            spreadGrade: 'Ungraded',
            winnerGrade: 'Ungraded',
          },
        ],
      },
    });
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 5, gradedAt: null, isGraded: false, resultsPublished: false },
    ];

    renderPredictionsPage();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    await waitFor(() => {
      expect(screen.getAllByText('Iowa').length).toBeGreaterThanOrEqual(1);
    });

    const seasonButton = screen.getByRole('button', { name: /2024 Season/i });
    await user.click(seasonButton);

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('cancels delete modal without calling delete mutation', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
    ];

    renderPredictionsPage();

    const seasonButton = screen.getByRole('button', { name: /2024 Season/i });
    await user.click(seasonButton);

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete Published Predictions')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Delete Published Predictions')).not.toBeInTheDocument();
    });
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it('renders refresh cached data button', () => {
    renderPredictionsPage();
    expect(screen.getByRole('button', { name: 'Refresh Cached Data' })).toBeInTheDocument();
  });

  it('shows confirm modal instead of calling refreshCache immediately when refresh button is clicked', async () => {
    const user = userEvent.setup();

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Refresh Cached Data' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Refresh Cached Data')).toBeInTheDocument();
    expect(mockRefreshCacheMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call refreshCache when confirm modal is cancelled', async () => {
    const user = userEvent.setup();

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Refresh Cached Data' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockRefreshCacheMutateAsync).not.toHaveBeenCalled();
  });

  it('calls refreshCache with selected season and week when confirmed', async () => {
    const user = userEvent.setup();
    mockRefreshCacheMutateAsync.mockResolvedValue({ removedCount: 6, season: 2024, week: 5 });

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Refresh Cached Data' }));

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(mockRefreshCacheMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    });
  });

  it('shows removed count feedback after a successful confirmed refresh', async () => {
    const user = userEvent.setup();
    mockRefreshCacheMutateAsync.mockResolvedValue({ removedCount: 6, season: 2024, week: 5 });

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Refresh Cached Data' }));

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(screen.getByText('Removed 6 cached entries')).toBeInTheDocument();
    });
  });

  it('renders grade results section', () => {
    renderPredictionsPage();
    expect(screen.getByText('Grade Results')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Grade' })).toBeInTheDocument();
  });

  it('calls grade mutation with selected season and week on Grade click', async () => {
    const user = userEvent.setup();
    mockGradeMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: { isGraded: true, resultsPublished: false, season: 2024, week: 5, predictions: [] },
      unmatchedGameCount: 0,
    });

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Grade' }));

    expect(mockGradeMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
  });

  it('shows graded results in the active view after successful grading', async () => {
    const user = userEvent.setup();
    mockGradeMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: { isGraded: true, resultsPublished: false, season: 2024, week: 5, predictions: [gradedGamePrediction] },
      unmatchedGameCount: 0,
    });

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Grade' }));

    await waitFor(() => {
      expect(screen.getByText(/Just Graded/)).toBeInTheDocument();
    });
  });

  it('shows unmatched games banner when grading leaves games unmatched', async () => {
    const user = userEvent.setup();
    mockGradeMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: { isGraded: true, resultsPublished: false, season: 2024, week: 5, predictions: [gradedGamePrediction] },
      unmatchedGameCount: 2,
    });

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Grade' }));

    await waitFor(() => {
      expect(screen.getByText('Unmatched games: 2')).toBeInTheDocument();
    });
  });

  it('shows error feedback when grading fails', async () => {
    const user = userEvent.setup();
    mockGradeMutateAsync.mockRejectedValue(new Error('Grading failed'));

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Grade' }));

    await waitFor(() => {
      expect(screen.getByText('Grading failed')).toBeInTheDocument();
    });
  });

  it('publishes graded results from the active view section', async () => {
    const user = userEvent.setup();
    mockGradeMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: { isGraded: true, resultsPublished: false, season: 2024, week: 5, predictions: [gradedGamePrediction] },
      unmatchedGameCount: 0,
    });
    mockPublishResultsMutateAsync.mockResolvedValue(undefined);

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Grade' }));

    await waitFor(() => {
      expect(screen.getByText(/Just Graded/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Publish Results' }));

    expect(mockPublishResultsMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
  });

  it('clears graded results preview when the matching persisted prediction is deleted', async () => {
    const user = userEvent.setup();
    mockGradeMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: { isGraded: true, resultsPublished: false, season: 2024, week: 5, predictions: [gradedGamePrediction] },
      unmatchedGameCount: 0,
    });
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    mockSummariesData = [
      { season: 2024, week: 5, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 1, gradedAt: '2024-09-02T00:00:00Z', isGraded: true, resultsPublished: false },
    ];

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Grade' }));

    await waitFor(() => {
      expect(screen.getByText(/Just Graded/)).toBeInTheDocument();
    });

    const seasonButton = screen.getByRole('button', { name: /2024 Season/i });
    await user.click(seasonButton);

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText(/Just Graded/)).not.toBeInTheDocument();
    });
  });

  it('does not clear graded results preview when a different week is deleted', async () => {
    const user = userEvent.setup();
    mockGradeMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: { isGraded: true, resultsPublished: false, season: 2024, week: 5, predictions: [gradedGamePrediction] },
      unmatchedGameCount: 0,
    });
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 1, gradedAt: null, isGraded: false, resultsPublished: false },
    ];

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Grade' }));

    await waitFor(() => {
      expect(screen.getByText(/Just Graded/)).toBeInTheDocument();
    });

    const seasonButton = screen.getByRole('button', { name: /2024 Season/i });
    await user.click(seasonButton);

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
    expect(screen.getByText(/Just Graded/)).toBeInTheDocument();
  });
});
