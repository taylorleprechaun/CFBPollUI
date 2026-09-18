import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminScoreOverridesPage } from '../../pages/admin-score-overrides-page';

const mockToken = 'test-token';

vi.mock('../../hooks/use-auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    token: mockToken,
  }),
}));

vi.mock('../../hooks/use-season', () => ({
  useSeason: () => ({
    nextSeason: null,
    refetchSeasons: vi.fn(),
    seasons: [2025, 2024],
    seasonsError: null,
    seasonsLoading: false,
    selectedSeason: 2025,
    setSelectedSeason: vi.fn(),
  }),
}));

vi.mock('../../hooks/use-weeks', () => ({
  useWeeks: () => ({
    data: {
      season: 2025,
      weeks: [{ weekNumber: 3, label: 'Week 4' }],
    },
    isLoading: false,
  }),
}));

const mockCompletedGame = {
  awayPoints: 21,
  awayTeam: 'Iowa',
  gameID: 401234561,
  hasOverride: false,
  homePoints: 24,
  homeTeam: 'Nebraska',
  seasonType: 'regular',
};

let mockCompletedGamesData: { games: typeof mockCompletedGame[] } | undefined;
let mockCompletedGamesLoading = false;

vi.mock('../../hooks/use-completed-games', () => ({
  useCompletedGames: () => ({
    data: mockCompletedGamesData,
    isLoading: mockCompletedGamesLoading,
  }),
}));

const mockOverride = {
  awayTeam: 'Texas',
  createdAt: '2025-09-20T00:00:00Z',
  gameID: 401234562,
  homeTeam: 'Oklahoma',
  modifiedAt: '2025-09-20T00:00:00Z',
  originalAwayPoints: 20,
  originalHomePoints: 24,
  overrideAwayPoints: 24,
  overrideHomePoints: 20,
  reason: 'A targeting call was missed on the game-deciding play.',
  season: 2025,
  seasonType: 'regular',
  week: 4,
};

let mockOverridesData: typeof mockOverride[] | undefined;
let mockOverridesLoading = false;
const mockSaveOverride = vi.fn();
const mockDeleteOverride = vi.fn();

vi.mock('../../hooks/use-game-overrides', () => ({
  useGameOverrides: () => ({
    data: mockOverridesData,
    deleteOverride: mockDeleteOverride,
    isDeleting: false,
    isLoading: mockOverridesLoading,
    isSaving: false,
    saveOverride: mockSaveOverride,
  }),
}));

describe('AdminScoreOverridesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompletedGamesData = { games: [mockCompletedGame] };
    mockCompletedGamesLoading = false;
    mockOverridesData = [mockOverride];
    mockOverridesLoading = false;
  });

  it('calls deleteOverride with the gameID when a delete is confirmed', async () => {
    render(<AdminScoreOverridesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(mockDeleteOverride).toHaveBeenCalledWith(401234562);
  });

  it('calls saveOverride with the edited fields once the wizard is completed', async () => {
    render(<AdminScoreOverridesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Override Score' }));
    await userEvent.clear(screen.getByLabelText('Nebraska Score'));
    await userEvent.type(screen.getByLabelText('Nebraska Score'), '27');
    await userEvent.type(screen.getByLabelText('Reason'), 'Targeting was missed on the final play.');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    await userEvent.click(screen.getByLabelText('I understand this does not retroactively update published results.'));
    await userEvent.type(screen.getByLabelText('Type 21-27 to confirm'), '21-27');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Override' }));

    expect(mockSaveOverride).toHaveBeenCalledWith({
      gameId: 401234561,
      overrideAwayPoints: 21,
      overrideHomePoints: 27,
      reason: 'Targeting was missed on the final play.',
    });
  });

  it('does not call deleteOverride when the delete confirmation is cancelled', async () => {
    render(<AdminScoreOverridesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(mockDeleteOverride).not.toHaveBeenCalled();
  });

  it('opens the form pre-filled with the current override score and reason when Edit is clicked', async () => {
    render(<AdminScoreOverridesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('heading', { name: 'Override Score: Texas @ Oklahoma' })).toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toHaveValue('A targeting call was missed on the game-deciding play.');
  });

  it('opens the form pre-filled with the current score when Override Score is clicked', async () => {
    render(<AdminScoreOverridesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Override Score' }));

    expect(screen.getByRole('heading', { name: 'Override Score: Iowa @ Nebraska' })).toBeInTheDocument();
  });

  it('renders the page heading', () => {
    render(<AdminScoreOverridesPage />);

    expect(screen.getByRole('heading', { name: 'Score Overrides' })).toBeInTheDocument();
  });

  it('renders the raw week label in the Completed Games header, not the rankings-shifted one', () => {
    render(<AdminScoreOverridesPage />);

    expect(screen.getByText('Completed Games - 2025 Week 3')).toBeInTheDocument();
  });

  it('shows the raw week number in the week selector, not the rankings-shifted label', () => {
    render(<AdminScoreOverridesPage />);

    expect(screen.getByRole('option', { name: 'Week 3' })).toBeInTheDocument();
  });
});
