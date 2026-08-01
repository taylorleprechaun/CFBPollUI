import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GradePredictionsSection } from '../../../components/admin';

const defaultProps = {
  actionFeedback: null,
  isGrading: false,
  onClearFeedback: vi.fn(),
  onGrade: vi.fn(),
  selectedSeason: 2024,
  selectedWeek: 5,
};

describe('GradePredictionsSection', () => {
  it('renders heading', () => {
    render(<GradePredictionsSection {...defaultProps} />);

    expect(screen.getByText('Grade Results')).toBeInTheDocument();
  });

  it('calls onGrade when button is clicked', async () => {
    const onGrade = vi.fn();
    render(<GradePredictionsSection {...defaultProps} onGrade={onGrade} />);

    await userEvent.click(screen.getByRole('button', { name: 'Grade' }));

    expect(onGrade).toHaveBeenCalled();
  });

  it('shows Grading... text when isGrading is true', () => {
    render(<GradePredictionsSection {...defaultProps} isGrading={true} />);

    expect(screen.getByRole('button', { name: 'Grading...' })).toBeDisabled();
  });

  it('disables button when season is null', () => {
    render(<GradePredictionsSection {...defaultProps} selectedSeason={null} />);

    expect(screen.getByRole('button', { name: 'Grade' })).toBeDisabled();
  });

  it('disables button when week is null', () => {
    render(<GradePredictionsSection {...defaultProps} selectedWeek={null} />);

    expect(screen.getByRole('button', { name: 'Grade' })).toBeDisabled();
  });

  it('shows success feedback message matching the selected season and week', () => {
    render(
      <GradePredictionsSection
        {...defaultProps}
        actionFeedback={{ key: 'grade-2024-5', type: 'success' }}
      />
    );

    expect(screen.getByLabelText('Success')).toBeInTheDocument();
  });

  it('shows error feedback message matching the selected season and week', () => {
    render(
      <GradePredictionsSection
        {...defaultProps}
        actionFeedback={{ key: 'grade-2024-5', type: 'error', message: 'Grading failed' }}
      />
    );

    expect(screen.getByText('Grading failed')).toBeInTheDocument();
  });

  it('does not show feedback for a different season/week key', () => {
    render(
      <GradePredictionsSection
        {...defaultProps}
        actionFeedback={{ key: 'grade-2023-1', type: 'error', message: 'Grading failed' }}
      />
    );

    expect(screen.queryByText('Grading failed')).not.toBeInTheDocument();
  });
});
