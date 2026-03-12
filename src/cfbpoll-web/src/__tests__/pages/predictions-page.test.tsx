import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PredictionsPage } from '../../pages/predictions-page';

let mockToken: string | null = 'test-token';

const mockSetSelectedSeason = vi.fn();

vi.mock('../../contexts/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: mockToken !== null,
    login: vi.fn(),
    logout: vi.fn(),
    token: mockToken,
  }),
}));

vi.mock('../../contexts/season-context', () => ({
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
let mockCalculateIsPending = false;

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
}));

let mockSummariesData: { season: number; week: number; isPublished: boolean; createdAt: string; gameCount: number }[] | undefined = [];
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

describe('PredictionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'test-token';
    mockSummariesData = [];
    mockSummariesError = null;
    mockCalculateIsPending = false;
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
      predictions: { season: 2024, week: 1, predictions: [] },
    });

    renderPredictionsPage();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
  });

  it('shows preview section after successful generation', async () => {
    const user = userEvent.setup();
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: {
        season: 2024,
        week: 1,
        predictions: [
          {
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
            predictedMargin: 10.5,
            predictedWinner: 'Ohio State',
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
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
      { season: 2024, week: 2, isPublished: false, createdAt: '2024-09-08T00:00:00Z', gameCount: 8 },
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
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
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

  it('publishes predictions from preview section', async () => {
    const user = userEvent.setup();
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: {
        season: 2024,
        week: 5,
        predictions: [
          {
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
            predictedMargin: 17.0,
            predictedWinner: 'Texas',
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
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
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
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderPredictionsPage();

    const seasonButton = screen.getByRole('button', { name: /2024 Season/i });
    await user.click(seasonButton);

    const publishButton = screen.getByRole('button', { name: 'Publish' });
    await user.click(publishButton);

    expect(mockPublishMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
  });

  it('clears calculated result when matching prediction is deleted', async () => {
    const user = userEvent.setup();
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: {
        season: 2024,
        week: 1,
        predictions: [
          {
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
            predictedMargin: 4.0,
            predictedWinner: 'Nebraska',
          },
        ],
      },
    });
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 5 },
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
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
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
});
