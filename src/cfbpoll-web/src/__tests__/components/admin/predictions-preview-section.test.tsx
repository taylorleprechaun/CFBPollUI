import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PredictionsPreviewSection } from '../../../components/admin';

const defaultProps = {
  calculatedResult: {
    isPersisted: true,
    predictions: {
      resultsPublished: false,
      season: 2024,
      week: 5,
      predictions: [
        {
          actualAwayScore: null,
          actualHomeScore: null,
          actualOverUnderResult: null,
          actualSpreadCoveringTeam: null,
          actualWinner: null,
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
          overUnderGrade: 'Ungraded',
          predictedMargin: 10.5,
          predictedWinner: 'Ohio State',
          spreadGrade: 'Ungraded',
          winnerGrade: 'Ungraded',
        },
        {
          actualAwayScore: null,
          actualHomeScore: null,
          actualOverUnderResult: null,
          actualSpreadCoveringTeam: null,
          actualWinner: null,
          awayLogoURL: 'https://example.com/iowa.png',
          awayTeam: 'Iowa',
          awayTeamScore: 21,
          bettingOverUnder: 42.0,
          bettingSpread: -3.0,
          homeLogoURL: 'https://example.com/nebraska.png',
          homeTeam: 'Nebraska',
          homeTeamScore: 24,
          myOverUnderPick: 'Over',
          mySpreadPick: 'Nebraska',
          neutralSite: false,
          overUnderGrade: 'Ungraded',
          predictedMargin: 3.5,
          predictedWinner: 'Nebraska',
          spreadGrade: 'Ungraded',
          winnerGrade: 'Ungraded',
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

  it('renders game count', () => {
    render(<PredictionsPreviewSection {...defaultProps} />);

    expect(screen.getByText('(2 games)')).toBeInTheDocument();
  });

  it('renders team names in score column', () => {
    render(<PredictionsPreviewSection {...defaultProps} />);

    expect(screen.getAllByText('Michigan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ohio State').length).toBeGreaterThanOrEqual(1);
  });

  it('renders predicted scores', () => {
    render(<PredictionsPreviewSection {...defaultProps} />);

    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('renders spread column', () => {
    render(<PredictionsPreviewSection {...defaultProps} />);

    expect(screen.getByText('Ohio State -7.5')).toBeInTheDocument();
  });

  it('renders over/under column', () => {
    render(<PredictionsPreviewSection {...defaultProps} />);

    expect(screen.getByText('48.5')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders my spread pick', () => {
    render(<PredictionsPreviewSection {...defaultProps} />);

    const ohioStateCells = screen.getAllByText('Ohio State');
    expect(ohioStateCells.length).toBeGreaterThanOrEqual(2);
  });

  it('renders my over/under pick', () => {
    render(<PredictionsPreviewSection {...defaultProps} />);

    expect(screen.getByText('Under')).toBeInTheDocument();
    expect(screen.getByText('Over')).toBeInTheDocument();
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
          resultsPublished: false,
          season: 2024,
          week: 5,
          predictions: [
            {
              actualAwayScore: null,
              actualHomeScore: null,
              actualOverUnderResult: null,
              actualSpreadCoveringTeam: null,
              actualWinner: null,
              awayLogoURL: 'https://example.com/texas.png',
              awayTeam: 'Texas',
              awayTeamScore: 24,
              bettingOverUnder: null,
              bettingSpread: null,
              homeLogoURL: 'https://example.com/oklahoma.png',
              homeTeam: 'Oklahoma',
              homeTeamScore: 21,
              myOverUnderPick: '',
              mySpreadPick: '',
              neutralSite: true,
              overUnderGrade: 'NotApplicable',
              predictedMargin: 3.0,
              predictedWinner: 'Texas',
              spreadGrade: 'NotApplicable',
              winnerGrade: 'Ungraded',
            },
          ],
        },
      },
    };

    render(<PredictionsPreviewSection {...props} />);

    expect(screen.getByText('(N)')).toBeInTheDocument();
  });

  it('shows N/A for null betting values', () => {
    const props = {
      ...defaultProps,
      calculatedResult: {
        isPersisted: true,
        predictions: {
          resultsPublished: false,
          season: 2024,
          week: 5,
          predictions: [
            {
              actualAwayScore: null,
              actualHomeScore: null,
              actualOverUnderResult: null,
              actualSpreadCoveringTeam: null,
              actualWinner: null,
              awayLogoURL: '',
              awayTeam: 'USC',
              awayTeamScore: 21,
              bettingOverUnder: null,
              bettingSpread: null,
              homeLogoURL: '',
              homeTeam: 'Notre Dame',
              homeTeamScore: 28,
              myOverUnderPick: '',
              mySpreadPick: '',
              neutralSite: false,
              overUnderGrade: 'NotApplicable',
              predictedMargin: 7.0,
              predictedWinner: 'Notre Dame',
              spreadGrade: 'NotApplicable',
              winnerGrade: 'Ungraded',
            },
          ],
        },
      },
    };

    render(<PredictionsPreviewSection {...props} />);

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThanOrEqual(2);
  });

  it('disables publish button when action is pending', () => {
    render(<PredictionsPreviewSection {...defaultProps} isActionPending={true} />);

    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
  });
});
