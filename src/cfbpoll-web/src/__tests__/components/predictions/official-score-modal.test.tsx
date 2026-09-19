import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { GamePredictionPublic } from '../../../schemas';

import { OfficialScoreModal } from '../../../components/predictions/official-score-modal';

const prediction: GamePredictionPublic = {
  actualAwayScore: 20,
  actualHomeScore: 24,
  actualOverUnderResult: 'Under',
  actualSpreadCoveringTeam: 'Texas',
  actualWinner: 'Texas',
  awayLogoURL: 'https://example.com/away.png',
  awayTeam: 'Oklahoma',
  awayTeamScore: 17,
  bettingOverUnder: 45.5,
  bettingSpread: -3.5,
  homeLogoURL: 'https://example.com/home.png',
  homeTeam: 'Texas',
  homeTeamScore: 28,
  myOverUnderPick: 'Over',
  mySpreadPick: 'Texas',
  neutralSite: false,
  overUnderGrade: 'Incorrect',
  predictedMargin: 11,
  predictedWinner: 'Texas',
  scoreOverrideReason: 'A targeting call was missed on the decisive fourth-down stop.',
  spreadGrade: 'Incorrect',
  winnerGrade: 'Correct',
};

describe('OfficialScoreModal', () => {
  it('calls onClose when Close is clicked', async () => {
    const onClose = vi.fn();
    render(<OfficialScoreModal onClose={onClose} prediction={prediction} />);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(<OfficialScoreModal onClose={onClose} prediction={prediction} />);

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked but not when the panel is clicked', async () => {
    const onClose = vi.fn();
    render(<OfficialScoreModal onClose={onClose} prediction={prediction} />);

    await userEvent.click(screen.getByText('Graded on the Official Score'));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the matchup, official final, and override reason', () => {
    render(<OfficialScoreModal onClose={vi.fn()} prediction={prediction} />);

    expect(screen.getByText('Oklahoma')).toBeInTheDocument();
    expect(screen.getByText('Texas')).toBeInTheDocument();
    expect(screen.getByText('20-24')).toBeInTheDocument();
    expect(screen.getByText('A targeting call was missed on the decisive fourth-down stop.')).toBeInTheDocument();
  });
});
