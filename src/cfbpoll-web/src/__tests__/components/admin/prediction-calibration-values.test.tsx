import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PredictionCalibrationValues } from '../../../components/admin';

const parameters = [
  { defaultValue: 0, description: 'First parameter', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 },
  { defaultValue: 0, description: 'Second parameter', key: 'paramB', label: 'Param B', max: 10, min: -10, step: 0.1 },
];

function renderValues(overrides: Partial<Parameters<typeof PredictionCalibrationValues>[0]> = {}) {
  const props = {
    currentValues: { paramA: 1, paramB: 0 },
    fieldErrors: { paramA: null, paramB: null },
    inputIdPrefix: 'test',
    inputValues: { paramA: '1.2', paramB: '0' },
    isLocked: false,
    isSuggestionLoading: false,
    onChange: vi.fn(),
    parameters,
    suggestedValues: { paramA: 1.2, paramB: -0.8 },
    suggestionNotes: { paramA: 'Note for A.', paramB: 'Note for B.' },
    ...overrides,
  };
  render(<PredictionCalibrationValues {...props} />);
  return props;
}

function rowFor(label: string) {
  return screen.getByRole('group', { name: `${label} values` });
}

describe('PredictionCalibrationValues', () => {
  it('disables the inputs when locked', () => {
    renderValues({ isLocked: true });

    expect(screen.getByLabelText('Param A')).toBeDisabled();
  });

  it('lists how each suggestion was worked out', () => {
    renderValues();

    expect(screen.getByText('Param A: Note for A.')).toBeInTheDocument();
    expect(screen.getByText('Param B: Note for B.')).toBeInTheDocument();
  });

  it('reports typing to the parent', async () => {
    const props = renderValues();

    await userEvent.type(screen.getByLabelText('Param B'), '1');

    expect(props.onChange).toHaveBeenCalled();
  });

  it('shows a decrease with a down arrow', () => {
    renderValues({ inputValues: { paramA: '0.5', paramB: '0' } });

    expect(within(rowFor('Param A')).getByText('▼ 0.5')).toBeInTheDocument();
  });

  it('shows a field error in place of the change', () => {
    renderValues({ fieldErrors: { paramA: 'Must be between -5 and 5', paramB: null }, inputValues: { paramA: '9', paramB: '0' } });

    const row = within(rowFor('Param A'));
    expect(row.getByText('Must be between -5 and 5')).toBeInTheDocument();
    expect(row.getByText('No change')).toBeInTheDocument();
  });

  it('shows a placeholder while the suggestion loads', () => {
    renderValues({ isSuggestionLoading: true, suggestedValues: undefined, suggestionNotes: undefined });

    expect(within(rowFor('Param A')).getByText('…')).toBeInTheDocument();
    expect(screen.queryByText('How the suggestions were worked out')).not.toBeInTheDocument();
  });

  it('shows each value as current, suggested and the change the new value makes', () => {
    renderValues();

    const row = within(rowFor('Param A'));
    expect(row.getByText('+1')).toBeInTheDocument();
    expect(row.getByText('+1.2')).toBeInTheDocument();
    expect(row.getByText('▲ 0.2')).toBeInTheDocument();
    expect(within(rowFor('Param B')).getByText('No change')).toBeInTheDocument();
  });
});
