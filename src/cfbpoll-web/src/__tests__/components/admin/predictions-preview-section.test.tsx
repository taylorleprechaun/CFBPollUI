import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PredictionsPreviewSection } from '../../../components/admin';

const defaultProps = {
  calculatedResult: {
    isPersisted: true,
    predictions: {
      season: 2024,
      week: 5,
      predictions: [
        {
          awayTeam: 'Michigan',
          confidence: 75.5,
          homeTeam: 'Ohio State',
          homeWinProbability: 0.72,
          neutralSite: false,
          predictedMargin: 10.5,
          predictedWinner: 'Ohio State',
        },
        {
          awayTeam: 'Iowa',
          confidence: 55.0,
          homeTeam: 'Nebraska',
          homeWinProbability: 0.62,
          neutralSite: false,
          predictedMargin: 3.5,
          predictedWinner: 'Nebraska',
        },
      ],
    },
  },
  actionFeedback: null,
  isActionPending: false,
  onClearFeedback: vi.fn(),
  onPublish: vi.fn(),
};

describe('PredictionsPreviewSection', () => {
  it('renders preview heading with season and week', () => {
    render(<PredictionsPreviewSection {...defaultProps} />);

    expect(screen.getByText(/Preview:/)).toBeInTheDocument();
  });

  it('renders prediction table with matchups', () => {
    render(<PredictionsPreviewSection {...defaultProps} />);

    expect(screen.getByText('Michigan @ Ohio State')).toBeInTheDocument();
    expect(screen.getByText('Iowa @ Nebraska')).toBeInTheDocument();
  });

  it('renders game count', () => {
    render(<PredictionsPreviewSection {...defaultProps} />);

    expect(screen.getByText('(2 games)')).toBeInTheDocument();
  });

  it('renders predicted winners', () => {
    render(<PredictionsPreviewSection {...defaultProps} />);

    const winners = screen.getAllByText('Ohio State');
    expect(winners.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Nebraska')).toBeInTheDocument();
  });

  it('calls onPublish when Publish button is clicked', async () => {
    const onPublish = vi.fn();
    render(<PredictionsPreviewSection {...defaultProps} onPublish={onPublish} />);

    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(onPublish).toHaveBeenCalledWith(2024, 5);
  });

  it('shows warning when not persisted', () => {
    const props = {
      ...defaultProps,
      calculatedResult: {
        ...defaultProps.calculatedResult,
        isPersisted: false,
      },
    };

    render(<PredictionsPreviewSection {...props} />);

    expect(screen.getByText(/Warning: Predictions were not persisted/)).toBeInTheDocument();
  });

  it('does not show warning when persisted', () => {
    render(<PredictionsPreviewSection {...defaultProps} />);

    expect(screen.queryByText(/Warning/)).not.toBeInTheDocument();
  });

  it('marks neutral site games', () => {
    const props = {
      ...defaultProps,
      calculatedResult: {
        isPersisted: true,
        predictions: {
          season: 2024,
          week: 5,
          predictions: [
            {
              awayTeam: 'Texas',
              confidence: 60,
              homeTeam: 'Oklahoma',
              homeWinProbability: 0.55,
              neutralSite: true,
              predictedMargin: 3.0,
              predictedWinner: 'Texas',
            },
          ],
        },
      },
    };

    render(<PredictionsPreviewSection {...props} />);

    expect(screen.getByText('(N)')).toBeInTheDocument();
  });

  it('disables publish button when action is pending', () => {
    render(<PredictionsPreviewSection {...defaultProps} isActionPending={true} />);

    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
  });
});
