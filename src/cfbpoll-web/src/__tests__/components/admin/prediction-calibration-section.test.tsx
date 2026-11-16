import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PredictionCalibrationAnalysis, PredictionCalibrationResponse } from '../../../schemas/admin';

import { rechartsMock } from '../../mocks/recharts';

vi.mock('recharts', () => rechartsMock);

vi.mock('../../../hooks/use-theme', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

import { PredictionCalibrationSection } from '../../../components/admin';

const mockMutateAsync = vi.fn();
const mockPreviewMutate = vi.fn();
let mockAnalysis: PredictionCalibrationAnalysis | undefined = undefined;
let mockAnalysisEnabled = false;
let mockAnalysisError: Error | null = null;
let mockAnalysisLoading = false;
let mockCalibration: PredictionCalibrationResponse | undefined = undefined;
let mockError: Error | null = null;
let mockIsLoading = false;
let mockIsSaving = false;
let mockPreview: PredictionCalibrationAnalysis | undefined = undefined;
let mockPreviewVariables: { season: number; values: Record<string, number>; week: number } | undefined = undefined;

vi.mock('../../../hooks/use-analyze-prediction-calibration', () => ({
  useAnalyzePredictionCalibration: () => ({
    data: mockPreview,
    error: null,
    isPending: false,
    mutate: mockPreviewMutate,
    variables: mockPreviewVariables,
  }),
}));

vi.mock('../../../hooks/use-prediction-calibration', () => ({
  usePredictionCalibration: () => ({ data: mockCalibration, error: mockError, isLoading: mockIsLoading }),
}));

vi.mock('../../../hooks/use-prediction-calibration-analysis', () => ({
  usePredictionCalibrationAnalysis: (_token: string | null, _season: number | null, _week: number | null, enabled: boolean) => {
    mockAnalysisEnabled = enabled;
    return { data: mockAnalysis, error: mockAnalysisError, isLoading: mockAnalysisLoading };
  },
}));

vi.mock('../../../hooks/use-prediction-calibration-history', () => ({
  usePredictionCalibrationHistory: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../../hooks/use-save-prediction-calibration', () => ({
  useSavePredictionCalibration: () => ({ isPending: mockIsSaving, mutateAsync: mockMutateAsync }),
}));

function buildAnalysis(overrides: Partial<PredictionCalibrationAnalysis> = {}): PredictionCalibrationAnalysis {
  const record = { correct: 30, incorrect: 25, push: 1 };
  const summary = { gradedGameCount: 56, marginBias: null, marginMAE: null, marginRMSE: null, overUnder: record, spread: record, winner: record };
  return {
    backtestWeeks: [{ candidate: null, season: 2026, suggested: summary, suggestedValues: { paramA: 1, paramB: 0 }, used: summary, usedValues: { paramA: 0, paramB: 0 }, week: 9 }],
    candidateValues: null,
    suggestedValues: { paramA: 1.5, paramB: -0.8 },
    suggestionNotes: { paramA: 'Note for A.', paramB: 'Note for B.' },
    ...overrides,
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
    mockAnalysis = buildAnalysis();
    mockAnalysisEnabled = false;
    mockAnalysisError = null;
    mockAnalysisLoading = false;
    mockCalibration = buildCalibration();
    mockError = null;
    mockIsLoading = false;
    mockIsSaving = false;
    mockPreview = undefined;
    mockPreviewVariables = undefined;
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

  it('ignores a test of typed values run for a different week', () => {
    mockPreview = buildAnalysis({ candidateValues: { paramA: 2, paramB: 0 } });
    mockPreviewVariables = { season: 2026, values: { paramA: 2, paramB: 0 }, week: 9 };

    renderSection();

    expect(screen.getByRole('heading', { name: 'How the suggestions have done this season' })).toBeInTheDocument();
  });

  it('loads the analysis automatically for a calibrated season', () => {
    renderSection();

    expect(mockAnalysisEnabled).toBe(true);
    expect(screen.getByText('Note for A.', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How the suggestions have done this season' })).toBeInTheDocument();
  });

  it('renders the selected week in the heading', () => {
    renderSection();

    expect(screen.getByRole('heading', { name: 'Values for 2026 Week 11' })).toBeInTheDocument();
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
    expect(mockAnalysisEnabled).toBe(false);
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

  it('shows the analysis error', () => {
    mockAnalysis = undefined;
    mockAnalysisError = new Error('Server unavailable');

    renderSection();

    expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
  });

  it('shows the analysis progress while it runs', () => {
    mockAnalysis = undefined;
    mockAnalysisLoading = true;

    renderSection();

    expect(screen.getByText(/Running the analysis/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use suggested values' })).toBeDisabled();
  });

  it('shows the load error', () => {
    mockCalibration = undefined;
    mockError = new Error('Server unavailable');

    renderSection();

    expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
  });

  it('shows the locked state with disabled inputs and no Save button', () => {
    mockCalibration = buildCalibration({ isLocked: true });

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

  it('shows the typed values toggle once the test returns', () => {
    mockPreview = buildAnalysis({ candidateValues: { paramA: 2, paramB: 0 } });
    mockPreviewVariables = { season: 2026, values: { paramA: 2, paramB: 0 }, week: 10 };

    renderSection();

    expect(screen.getByRole('button', { name: 'Your values' })).toBeInTheDocument();
  });

  it('tests the typed values on past weeks', async () => {
    renderSection();

    await userEvent.clear(screen.getByLabelText('Param A'));
    await userEvent.type(screen.getByLabelText('Param A'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Test my values on past weeks' }));

    expect(mockPreviewMutate).toHaveBeenCalledWith({ season: 2026, values: { paramA: 2, paramB: 0 }, week: 10 });
  });

  it('treats edits made after applying a suggestion as manual', async () => {
    mockMutateAsync.mockResolvedValue(buildCalibration());
    renderSection();

    await userEvent.click(screen.getByRole('button', { name: 'Use suggested values' }));
    await userEvent.clear(screen.getByLabelText('Param B'));
    await userEvent.type(screen.getByLabelText('Param B'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ isAcceptedSuggestion: false }));
  });
});
