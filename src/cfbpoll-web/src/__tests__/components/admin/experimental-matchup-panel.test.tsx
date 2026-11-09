import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExperimentalMatchupPanel } from '../../../components/admin/experimental-matchup-panel';

const mockHandleRun = vi.fn();
let mockTeamsResult: { data: string[] | undefined; error: Error | null; isLoading: boolean };

vi.mock('../../../hooks/use-season-fbs-teams', () => ({
  useSeasonFbsTeams: () => mockTeamsResult,
}));

vi.mock('../../../hooks/use-experimental-matchup-state', () => ({
  useExperimentalMatchupState: () => ({
    handleRun: mockHandleRun,
    isRunning: false,
    runState: {
      V1: { error: null, result: null, status: 'idle' },
      V2: { error: null, result: null, status: 'idle' },
    },
    submittedMatchup: null,
  }),
}));

const WEEKS = [
  { isComplete: true, label: 'Week 6', predictionsPublished: false, rankingsPublished: false, weekNumber: 5 },
  { isComplete: true, label: 'Week 7', predictionsPublished: false, rankingsPublished: false, weekNumber: 6 },
];

interface RenderOptions {
  onSeasonChange?: (season: number) => void;
  onWeekChange?: (week: number | null) => void;
  selectedWeek?: number | null;
}

async function pickTeam(label: string, team: string) {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  await userEvent.click(screen.getByRole('option', { name: team }));
}

function renderPanel({ onSeasonChange = vi.fn(), onWeekChange = vi.fn(), selectedWeek = 5 }: RenderOptions = {}) {
  return render(
    <ExperimentalMatchupPanel
      onSeasonChange={onSeasonChange}
      onWeekChange={onWeekChange}
      seasons={[2024, 2023]}
      seasonsLoading={false}
      selectedSeason={2024}
      selectedWeek={selectedWeek}
      token="test-token"
      weeks={WEEKS}
      weeksLoading={false}
    />
  );
}

describe('ExperimentalMatchupPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTeamsResult = { data: ['Iowa', 'Michigan', 'Texas'], error: null, isLoading: false };
  });

  it('clears both teams when the season changes', async () => {
    const handleSeasonChange = vi.fn();
    const handleWeekChange = vi.fn();
    renderPanel({ onSeasonChange: handleSeasonChange, onWeekChange: handleWeekChange });
    await pickTeam('Away Team', 'Texas');
    await pickTeam('Home Team', 'Iowa');

    await userEvent.selectOptions(screen.getByLabelText('Season'), '2023');

    expect(handleSeasonChange).toHaveBeenCalledWith(2023);
    expect(handleWeekChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('combobox', { name: 'Away Team' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Home Team' })).toHaveValue('');
  });

  it('clears both teams when the week changes', async () => {
    const handleWeekChange = vi.fn();
    renderPanel({ onWeekChange: handleWeekChange });
    await pickTeam('Away Team', 'Texas');

    await userEvent.selectOptions(screen.getByLabelText('Week'), '6');

    expect(handleWeekChange).toHaveBeenCalledWith(6);
    expect(screen.getByRole('combobox', { name: 'Away Team' })).toHaveValue('');
  });

  it('disables Predict Matchup until both teams are picked', async () => {
    renderPanel();

    expect(screen.getByRole('button', { name: 'Predict Matchup' })).toBeDisabled();

    await pickTeam('Away Team', 'Texas');
    expect(screen.getByRole('button', { name: 'Predict Matchup' })).toBeDisabled();

    await pickTeam('Home Team', 'Iowa');
    expect(screen.getByRole('button', { name: 'Predict Matchup' })).toBeEnabled();
  });

  it('disables the swap button for neutral-site games', async () => {
    renderPanel();
    await pickTeam('Away Team', 'Texas');

    expect(screen.getByRole('button', { name: 'Swap home and away teams' })).toBeEnabled();

    await userEvent.click(screen.getByLabelText('Neutral site'));

    expect(screen.getByRole('button', { name: 'Swap home and away teams' })).toBeDisabled();
  });

  it('disables the team pickers until a week is selected', () => {
    renderPanel({ selectedWeek: null });

    expect(screen.getByRole('combobox', { name: 'Away Team' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Home Team' })).toBeDisabled();
  });

  it('hides the team picked on the other side', async () => {
    renderPanel();
    await pickTeam('Away Team', 'Texas');

    await userEvent.click(screen.getByRole('combobox', { name: 'Home Team' }));

    const homeList = screen.getByRole('listbox', { name: 'Home Team' });
    expect(within(homeList).queryByRole('option', { name: 'Texas' })).not.toBeInTheDocument();
    expect(within(homeList).getAllByRole('option')).toHaveLength(2);
  });

  it('runs the selected versions with the picked matchup and neutral flag', async () => {
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'V1' }));
    await pickTeam('Away Team', 'Michigan');
    await pickTeam('Home Team', 'Texas');
    await userEvent.click(screen.getByLabelText('Neutral site'));

    await userEvent.click(screen.getByRole('button', { name: 'Predict Matchup' }));

    expect(mockHandleRun).toHaveBeenCalledWith(['V1', 'V2'], {
      awayTeam: 'Michigan',
      homeTeam: 'Texas',
      neutralSite: true,
    });
  });

  it('shows an error when the team list fails to load', () => {
    mockTeamsResult = { data: undefined, error: new Error('Teams failed'), isLoading: false };

    renderPanel();

    expect(screen.getByText('Teams failed')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Away Team' })).toBeDisabled();
  });

  it('swaps the home and away teams', async () => {
    renderPanel();
    await pickTeam('Away Team', 'Texas');
    await pickTeam('Home Team', 'Iowa');

    await userEvent.click(screen.getByRole('button', { name: 'Swap home and away teams' }));

    expect(screen.getByRole('combobox', { name: 'Away Team' })).toHaveValue('Iowa');
    expect(screen.getByRole('combobox', { name: 'Home Team' })).toHaveValue('Texas');
  });
});
