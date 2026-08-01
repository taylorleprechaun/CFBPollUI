import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GradedResultsPreviewSection } from '../../../components/admin';

const defaultProps = {
  actionFeedback: null,
  gradedResult: {
    isPersisted: true,
    unmatchedGameCount: 0,
    predictions: {
      resultsPublished: true,
      season: 2024,
      week: 5,
      predictions: [
        {
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
        },
        {
          actualAwayScore: 24,
          actualHomeScore: 21,
          actualOverUnderResult: 'Push',
          actualSpreadCoveringTeam: 'Iowa',
          actualWinner: 'Iowa',
          awayLogoURL: 'https://example.com/iowa.png',
          awayTeam: 'Iowa',
          awayTeamScore: 21,
          bettingOverUnder: 45.0,
          bettingSpread: -3.0,
          homeLogoURL: 'https://example.com/nebraska.png',
          homeTeam: 'Nebraska',
          homeTeamScore: 24,
          myOverUnderPick: 'Over',
          mySpreadPick: 'Nebraska',
          neutralSite: false,
          overUnderGrade: 'Push',
          predictedMargin: 3.5,
          predictedWinner: 'Nebraska',
          spreadGrade: 'Incorrect',
          winnerGrade: 'Incorrect',
        },
      ],
    },
  },
  isActionPending: false,
  onClearFeedback: vi.fn(),
  onPublishResults: vi.fn(),
};

describe('GradedResultsPreviewSection', () => {
  it('renders heading with season and week', () => {
    render(<GradedResultsPreviewSection {...defaultProps} />);

    expect(screen.getByText(/Graded Results:/)).toBeInTheDocument();
  });

  it('renders game count', () => {
    render(<GradedResultsPreviewSection {...defaultProps} />);

    expect(screen.getByText('(2 games)')).toBeInTheDocument();
  });

  it('renders final scores', () => {
    render(<GradedResultsPreviewSection {...defaultProps} />);

    expect(screen.getByText((_, element) => element?.textContent === 'Final: 17-28')).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === 'Final: 24-21')).toBeInTheDocument();
  });

  it('renders Correct grade badge for a correct winner pick', () => {
    render(<GradedResultsPreviewSection {...defaultProps} />);

    expect(screen.getAllByText('Correct').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Incorrect grade badge and the actual winner when the pick was wrong', () => {
    render(<GradedResultsPreviewSection {...defaultProps} />);

    expect(screen.getAllByText('Incorrect').length).toBeGreaterThanOrEqual(1);
    // Both the winner pick and the spread pick were wrong for the same team in this fixture.
    expect(screen.getAllByText('Actual: Iowa').length).toBe(2);
  });

  it('shows the actual over/under result for an incorrect O/U pick', () => {
    const props = {
      ...defaultProps,
      gradedResult: {
        ...defaultProps.gradedResult,
        predictions: {
          ...defaultProps.gradedResult.predictions,
          predictions: [
            {
              ...defaultProps.gradedResult.predictions.predictions[1],
              actualOverUnderResult: 'Under',
              overUnderGrade: 'Incorrect',
            },
          ],
        },
      },
    };

    render(<GradedResultsPreviewSection {...props} />);

    expect(screen.getByText('Actual: Under')).toBeInTheDocument();
  });

  it('does not show the actual over/under result for a Push grade', () => {
    render(<GradedResultsPreviewSection {...defaultProps} />);

    expect(screen.queryByText('Actual: Push')).not.toBeInTheDocument();
  });

  it('renders Push grade badge', () => {
    render(<GradedResultsPreviewSection {...defaultProps} />);

    expect(screen.getByText('Push')).toBeInTheDocument();
  });

  it('does not render an actual-winner line when the predicted winner was correct', () => {
    const props = {
      ...defaultProps,
      gradedResult: {
        ...defaultProps.gradedResult,
        predictions: {
          ...defaultProps.gradedResult.predictions,
          predictions: [defaultProps.gradedResult.predictions.predictions[0]],
        },
      },
    };

    render(<GradedResultsPreviewSection {...props} />);

    expect(screen.queryByText(/Actual:/)).not.toBeInTheDocument();
  });

  it('shows unmatched games banner when unmatchedGameCount is greater than zero', () => {
    const props = {
      ...defaultProps,
      gradedResult: { ...defaultProps.gradedResult, unmatchedGameCount: 3 },
    };

    render(<GradedResultsPreviewSection {...props} />);

    expect(screen.getByText('Unmatched games: 3')).toBeInTheDocument();
  });

  it('does not show unmatched games banner when unmatchedGameCount is zero', () => {
    render(<GradedResultsPreviewSection {...defaultProps} />);

    expect(screen.queryByText(/Unmatched games:/)).not.toBeInTheDocument();
  });

  it('shows warning when not persisted', () => {
    const props = {
      ...defaultProps,
      gradedResult: { ...defaultProps.gradedResult, isPersisted: false },
    };

    render(<GradedResultsPreviewSection {...props} />);

    expect(screen.getByText(/Warning: Graded results were not persisted/)).toBeInTheDocument();
  });

  it('does not show persistence warning when persisted', () => {
    render(<GradedResultsPreviewSection {...defaultProps} />);

    expect(screen.queryByText(/Warning: Graded results/)).not.toBeInTheDocument();
  });

  it('calls onPublishResults when Publish Results button is clicked', async () => {
    const onPublishResults = vi.fn();
    render(<GradedResultsPreviewSection {...defaultProps} onPublishResults={onPublishResults} />);

    await userEvent.click(screen.getByRole('button', { name: 'Publish Results' }));

    expect(onPublishResults).toHaveBeenCalledWith(2024, 5);
  });

  it('disables Publish Results button when action is pending', () => {
    render(<GradedResultsPreviewSection {...defaultProps} isActionPending={true} />);

    expect(screen.getByRole('button', { name: 'Publish Results' })).toBeDisabled();
  });

  it('shows success feedback for a matching publish-results key', () => {
    render(
      <GradedResultsPreviewSection
        {...defaultProps}
        actionFeedback={{ key: 'publish-results-2024-5', type: 'success' }}
      />
    );

    expect(screen.getByLabelText('Success')).toBeInTheDocument();
  });

  it('shows error feedback for a matching publish-results key', () => {
    render(
      <GradedResultsPreviewSection
        {...defaultProps}
        actionFeedback={{ key: 'publish-results-2024-5', type: 'error', message: 'Publish failed' }}
      />
    );

    expect(screen.getByText('Publish failed')).toBeInTheDocument();
  });

  it('does not show feedback for a different season/week key', () => {
    render(
      <GradedResultsPreviewSection
        {...defaultProps}
        actionFeedback={{ key: 'publish-results-2023-1', type: 'error', message: 'Publish failed' }}
      />
    );

    expect(screen.queryByText('Publish failed')).not.toBeInTheDocument();
  });
});
