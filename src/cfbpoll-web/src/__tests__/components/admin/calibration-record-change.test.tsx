import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CalibrationRecordChange } from '../../../components/admin';

describe('CalibrationRecordChange', () => {
  it('colors a gain green and shows both records', () => {
    render(<CalibrationRecordChange compared={{ correct: 28, incorrect: 28, push: 0 }} used={{ correct: 25, incorrect: 31, push: 0 }} />);

    expect(screen.getByText('+3')).toHaveClass('bg-green-100');
    expect(screen.getByText('25-31 → 28-28')).toBeInTheDocument();
  });

  it('colors a loss red', () => {
    render(<CalibrationRecordChange compared={{ correct: 23, incorrect: 33, push: 0 }} used={{ correct: 25, incorrect: 31, push: 0 }} />);

    expect(screen.getByText('-2')).toHaveClass('bg-red-100');
  });

  it('shows a neutral zero when nothing changed', () => {
    render(<CalibrationRecordChange compared={{ correct: 25, incorrect: 31, push: 0 }} used={{ correct: 25, incorrect: 31, push: 0 }} />);

    expect(screen.getByText('0')).toHaveClass('bg-gray-100');
  });

  it('shows the changed picks when given', () => {
    render(<CalibrationRecordChange change={{ changed: 5, comparedCorrect: 4, usedCorrect: 1 }} compared={{ correct: 28, incorrect: 28, push: 0 }} used={{ correct: 25, incorrect: 31, push: 0 }} />);

    expect(screen.getByText('5 picks changed, 4-1')).toBeInTheDocument();
  });
});
