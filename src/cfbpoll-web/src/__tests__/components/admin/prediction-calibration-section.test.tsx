import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PredictionCalibrationAnalysis, PredictionCalibrationResponse } from '../../../schemas/admin';

import { PredictionCalibrationSection } from '../../../components/admin';

const mockAnalyzeMutate = vi.fn();
const mockMutateAsync = vi.fn();
let mockAnalysis: PredictionCalibrationAnalysis | undefined = undefined;
let mockAnalysisVariables: { backtestWeeks: number; season: number; values?: Record<string, number>; week: number } | undefined = undefined;
let mockCalibration: PredictionCalibrationResponse | undefined = undefined;
let mockError: Error | null = null;
let mockHistoryEnabled = false;
let mockIsLoading = false;
let mockIsSaving = false;

vi.mock('../../../hooks/use-analyze-prediction-calibration', () => ({
  useAnalyzePredictionCalibration: () => ({
    data: mockAnalysis,
    error: null,
    isPending: false,
    mutate: mockAnalyzeMutate,
    variables: mockAnalysisVariables,
  }),
}));

vi.mock('../../../hooks/use-prediction-calibration', () => ({
  usePredictionCalibration: () => ({ data: mockCalibration, error: mockError, isLoading: mockIsLoading }),
}));

vi.mock('../../../hooks/use-prediction-calibration-history', () => ({
  usePredictionCalibrationHistory: (_token: string | null, _season: number | null, enabled: boolean) => {
    mockHistoryEnabled = enabled;
    return {
      data: [{ carriedFromSeason: null, carriedFromWeek: null, isLocked: true, season: 2026, source: 'Accepted', updatedAt: null, values: { paramA: 1.5, paramB: -2 }, week: 9 }],
      isLoading: false,
    };
  },
}));

vi.mock('../../../hooks/use-save-prediction-calibration', () => ({
  useSavePredictionCalibration: () => ({ isPending: mockIsSaving, mutateAsync: mockMutateAsync }),
}));

function buildAnalysis(): PredictionCalibrationAnalysis {
  const record = { correct: 30, incorrect: 25, push: 1 };
  const summary = { gradedGameCount: 56, marginBias: null, marginMAE: null, marginRMSE: null, overUnder: record, spread: record, winner: record };
  return {
    backtestWeeks: [{ candidate: summary, season: 2026, used: summary, usedValues: { paramA: 0, paramB: 0 }, week: 9 }],
    candidateTotal: summary,
    candidateValues: { paramA: 1.5, paramB: -0.8 },
    suggestedValues: { paramA: 1.5, paramB: -0.8 },
    suggestionNotes: { paramA: 'Note for A.', paramB: 'Note for B.' },
    usedTotal: summary,
  };
}

function buildCalibration(overrides: Partial<PredictionCalibrationResponse> = {}): PredictionCalibrationResponse {
  return {
    carriedFromSeason: null,
    carriedFromWeek: null,
    draftUsesDifferentValues: false,
    isLocked: false,
    isStored: true,
    isSupported: true,
    parameters: [
      { defaultValue: 0, description: 'First parameter', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 },
      { defaultValue: 0, description: 'Second parameter', key: 'paramB', label: 'Param B', max: 10, min: -10, step: 0.1 },
    ],
    season: 2026,
    source: 'Manual',
    updatedAt: '2026-11-01T12:00:00Z',
    values: { paramA: 1, paramB: 0 },
    week: 10,
    ...overrides,
  };
}

function renderSection() {
  return render(<PredictionCalibrationSection season={2026} token="test-token" week={10} />);
}

describe('PredictionCalibrationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalysis = undefined;
    mockAnalysisVariables = undefined;
    mockCalibration = buildCalibration();
    mockError = null;
    mockHistoryEnabled = false;
    mockIsLoading = false;
    mockIsSaving = false;
  });

  it('disables Save until a stored value is changed', async () => {
    renderSection();

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await userEvent.clear(screen.getByLabelText('Param A'));
    await userEvent.type(screen.getByLabelText('Param A'), '2');

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('enables Save for unchanged carried-forward values so they can be confirmed', () => {
    mockCalibration = buildCalibration({ carriedFromSeason: 2026, carriedFromWeek: 8, isStored: false, source: 'CarriedForward' });

    renderSection();

    expect(screen.getByText('Carried forward from 2026 Week 9, not saved yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('hides analysis results that were run for a different week', () => {
    mockAnalysis = buildAnalysis();
    mockAnalysisVariables = { backtestWeeks: 4, season: 2026, week: 9 };

    renderSection();

    expect(screen.queryByText('Suggested values')).not.toBeInTheDocument();
  });

  it('loads and shows the season history when expanded', async () => {
    renderSection();

    await userEvent.click(screen.getByRole('button', { name: 'Show season history' }));

    expect(mockHistoryEnabled).toBe(true);
    expect(screen.getByRole('columnheader', { name: 'Param A' })).toBeInTheDocument();
    expect(screen.getByText('+1.5')).toBeInTheDocument();
    expect(screen.getByText('Accepted suggestion')).toBeInTheDocument();
  });

  it('previews the typed values over the chosen weeks', async () => {
    renderSection();

    await userEvent.clear(screen.getByLabelText('Param A'));
    await userEvent.type(screen.getByLabelText('Param A'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Preview my values' }));

    expect(mockAnalyzeMutate).toHaveBeenCalledWith({ backtestWeeks: 8, season: 2026, values: { paramA: 2, paramB: 0 }, week: 10 });
  });

  it('renders the selected week as the heading', () => {
    renderSection();

    expect(screen.getByRole('heading', { name: '2026 Week 11' })).toBeInTheDocument();
  });

  it('requests a season-to-date comparison covering every earlier week', async () => {
    renderSection();

    await userEvent.selectOptions(screen.getByLabelText('Weeks to compare'), 'Season to date');
    await userEvent.click(screen.getByRole('button', { name: 'Get suggestion' }));

    expect(mockAnalyzeMutate).toHaveBeenCalledWith({ backtestWeeks: 9, season: 2026, week: 10 });
  });

  it('requests a suggestion over the chosen number of weeks', async () => {
    renderSection();

    await userEvent.selectOptions(screen.getByLabelText('Weeks to compare'), '6');
    await userEvent.click(screen.getByRole('button', { name: 'Get suggestion' }));

    expect(mockAnalyzeMutate).toHaveBeenCalledWith({ backtestWeeks: 6, season: 2026, week: 10 });
  });

  it('resets edits back to the saved values', async () => {
    renderSection();
    const input = screen.getByLabelText('Param A');

    await userEvent.clear(input);
    await userEvent.type(input, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(input).toHaveValue(1);
  });

  it('saves an applied suggestion as accepted', async () => {
    mockAnalysis = buildAnalysis();
    mockAnalysisVariables = { backtestWeeks: 4, season: 2026, week: 10 };
    mockMutateAsync.mockResolvedValue(buildCalibration());
    renderSection();

    await userEvent.click(screen.getByRole('button', { name: 'Use suggested values' }));

    expect(screen.getByLabelText('Param A')).toHaveValue(1.5);
    expect(screen.getByLabelText('Param B')).toHaveValue(-0.8);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockMutateAsync).toHaveBeenCalledWith({ isAcceptedSuggestion: true, season: 2026, values: { paramA: 1.5, paramB: -0.8 }, week: 10 });
  });

  it('saves the typed values and shows a confirmation', async () => {
    mockMutateAsync.mockResolvedValue(buildCalibration({ values: { paramA: 2.5, paramB: 0 } }));
    renderSection();

    await userEvent.clear(screen.getByLabelText('Param A'));
    await userEvent.type(screen.getByLabelText('Param A'), '2.5');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockMutateAsync).toHaveBeenCalledWith({ isAcceptedSuggestion: false, season: 2026, values: { paramA: 2.5, paramB: 0 }, week: 10 });
    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
  });

  it('says the season takes no calibration when unsupported', () => {
    mockCalibration = buildCalibration({ isSupported: false, parameters: [] });

    renderSection();

    expect(screen.getByText(/doesn’t take calibration values/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('shows a loading message while loading', () => {
    mockCalibration = undefined;
    mockIsLoading = true;

    renderSection();

    expect(screen.getByText('Loading calibration...')).toBeInTheDocument();
  });

  it('shows an out-of-range error and blocks saving', async () => {
    renderSection();

    await userEvent.clear(screen.getByLabelText('Param A'));
    await userEvent.type(screen.getByLabelText('Param A'), '9');

    expect(screen.getByText('Must be between -5 and 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('shows the analysis for this week with its suggestion and backtest', () => {
    mockAnalysis = buildAnalysis();
    mockAnalysisVariables = { backtestWeeks: 4, season: 2026, week: 10 };

    renderSection();

    expect(screen.getByText('Suggested values')).toBeInTheDocument();
    expect(screen.getByText('Note for A.')).toBeInTheDocument();
    expect(screen.getByText('Last 1 week: as used vs suggested values')).toBeInTheDocument();
  });

  it('shows the load error', () => {
    mockCalibration = undefined;
    mockError = new Error('Server unavailable');

    renderSection();

    expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
  });

  it('shows the locked state with disabled inputs and no Save button', () => {
    mockCalibration = buildCalibration({ carriedFromSeason: null, carriedFromWeek: null, isLocked: true });

    renderSection();

    expect(screen.getByText(/Locked because this week’s predictions are published/)).toBeInTheDocument();
    expect(screen.getByLabelText('Param A')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('shows the server message when saving fails', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Calibration can’t be changed after the week’s predictions are published'));
    renderSection();

    await userEvent.clear(screen.getByLabelText('Param B'));
    await userEvent.type(screen.getByLabelText('Param B'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('published');
  });

  it('treats edits made after applying a suggestion as manual', async () => {
    mockAnalysis = buildAnalysis();
    mockAnalysisVariables = { backtestWeeks: 4, season: 2026, week: 10 };
    mockMutateAsync.mockResolvedValue(buildCalibration());
    renderSection();

    await userEvent.click(screen.getByRole('button', { name: 'Use suggested values' }));
    await userEvent.clear(screen.getByLabelText('Param B'));
    await userEvent.type(screen.getByLabelText('Param B'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ isAcceptedSuggestion: false }));
  });
});
