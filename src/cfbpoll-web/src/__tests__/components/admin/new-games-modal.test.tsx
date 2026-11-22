import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GamePrediction } from '../../../schemas/admin';

import { NewGamesModal } from '../../../components/admin/new-games-modal';

vi.mock('../../../hooks/use-new-prediction-games', () => ({
  useNewPredictionGames: vi.fn(),
}));

vi.mock('../../../hooks/use-admin-mutations', () => ({
  useAddNewPredictionGames: vi.fn(),
}));

import { useAddNewPredictionGames } from '../../../hooks/use-admin-mutations';
import { useNewPredictionGames } from '../../../hooks/use-new-prediction-games';

function buildGame(overrides: Partial<GamePrediction> = {}): GamePrediction {
  return {
    actualAwayScore: null,
    actualHomeScore: null,
    actualOverUnderResult: null,
    actualSpreadCoveringTeam: null,
    actualWinner: null,
    awayLogoURL: '',
    awayTeam: 'Team A',
    awayTeamScore: 20,
    bettingOverUnder: 51.5,
    bettingSpread: -3.5,
    homeLogoURL: '',
    homeTeam: 'Team B',
    homeTeamScore: 27,
    myOverUnderPick: 'Under',
    mySpreadPick: 'Team B',
    neutralSite: true,
    overUnderGrade: 'Ungraded',
    predictedMargin: 7,
    predictedWinner: 'Team B',
    spreadGrade: 'Ungraded',
    winnerGrade: 'Ungraded',
    ...overrides,
  };
}

const mutateAsync = vi.fn();

function mockMutation(overrides: Record<string, unknown> = {}) {
  vi.mocked(useAddNewPredictionGames).mockReturnValue({
    error: null,
    isPending: false,
    mutateAsync,
    ...overrides,
  } as unknown as ReturnType<typeof useAddNewPredictionGames>);
}

function mockPreview(overrides: Record<string, unknown>) {
  vi.mocked(useNewPredictionGames).mockReturnValue({
    data: undefined,
    error: null,
    isLoading: false,
    ...overrides,
  } as unknown as ReturnType<typeof useNewPredictionGames>);
}

function renderModal(props: Partial<React.ComponentProps<typeof NewGamesModal>> = {}) {
  const onClose = vi.fn();
  render(<NewGamesModal isPublished={true} onClose={onClose} season={2026} token="token" week={15} {...props} />);
  return { onClose };
}

describe('NewGamesModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockMutation();
  });

  it('adds every checked game and closes', async () => {
    mutateAsync.mockResolvedValue({});
    mockPreview({ data: { games: [buildGame(), buildGame({ awayTeam: 'Team C', homeTeam: 'Team D' })], waitingOnLines: [] } });
    const { onClose } = renderModal();

    await userEvent.click(screen.getByLabelText(/Team C vs Team D/));
    await userEvent.click(screen.getByRole('button', { name: 'Add & Publish 1 Game' }));

    expect(mutateAsync).toHaveBeenCalledWith({ games: [buildGame()], season: 2026, week: 15 });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when Escape is pressed', async () => {
    mockPreview({ data: { games: [], waitingOnLines: [] } });
    const { onClose } = renderModal();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('disables the add button once every game is unchecked', async () => {
    mockPreview({ data: { games: [buildGame()], waitingOnLines: [] } });
    renderModal();

    await userEvent.click(screen.getByLabelText(/Team A vs Team B/));

    expect(screen.getByRole('button', { name: 'Add & Publish 0 Games' })).toBeDisabled();
  });

  it('labels the add button without publishing for a draft week', () => {
    mockPreview({ data: { games: [buildGame()], waitingOnLines: [] } });
    renderModal({ isPublished: false });

    expect(screen.getByRole('button', { name: 'Add 1 Game' })).toBeInTheDocument();
  });

  it('lists games waiting on a betting line without a checkbox', () => {
    mockPreview({ data: { games: [], waitingOnLines: [{ awayTeam: 'Team E', homeTeam: 'Team F', startDate: null }] } });
    renderModal();

    expect(screen.getByText('Waiting on lines')).toBeInTheDocument();
    expect(screen.getByText('Team E @ Team F')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add/ })).not.toBeInTheDocument();
  });

  it('shows an error when the check fails', () => {
    mockPreview({ error: new Error('Network error') });
    renderModal();

    expect(screen.getByText('Failed to check for new games.')).toBeInTheDocument();
  });

  it('shows each new game with its pick, spread, and over/under', () => {
    mockPreview({ data: { games: [buildGame()], waitingOnLines: [] } });
    renderModal();

    expect(screen.getByText('Pick: Team B 27-20')).toBeInTheDocument();
    expect(screen.getByText('Spread: Team B -3.5 · Team B')).toBeInTheDocument();
    expect(screen.getByText('O/U: 51.5 · Under')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('shows only Cancel while checking', () => {
    mockPreview({ isLoading: true });
    renderModal();

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.queryByText('No new games found.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add/ })).not.toBeInTheDocument();
  });

  it('shows the away winner\'s score first when the away team is picked', () => {
    mockPreview({ data: { games: [buildGame({ awayTeamScore: 30, homeTeamScore: 24, predictedWinner: 'Team A' })], waitingOnLines: [] } });
    renderModal();

    expect(screen.getByText('Pick: Team A 30-24')).toBeInTheDocument();
  });

  it('shows the empty state when there are no new games', () => {
    mockPreview({ data: { games: [], waitingOnLines: [] } });
    renderModal();

    expect(screen.getByText('No new games found.')).toBeInTheDocument();
  });

  it('shows the server message when adding fails and stays open', async () => {
    mutateAsync.mockRejectedValue(new Error('None of the selected games can be added'));
    mockMutation({ error: new Error('None of the selected games can be added') });
    mockPreview({ data: { games: [buildGame()], waitingOnLines: [] } });
    const { onClose } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Add & Publish 1 Game' }));

    expect(screen.getByText('None of the selected games can be added')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
