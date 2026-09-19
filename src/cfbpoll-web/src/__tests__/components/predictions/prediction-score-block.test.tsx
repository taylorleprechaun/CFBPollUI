import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { GamePredictionPublic } from '../../../schemas';

import { PredictionScoreBlock } from '../../../components/predictions/prediction-score-block';

const OVERRIDE_REASON = 'A targeting call was missed on the decisive fourth-down stop.';

function buildPrediction(overrides: Partial<GamePredictionPublic> = {}): GamePredictionPublic {
  return {
    actualAwayScore: 20,
    actualHomeScore: 24,
    actualOverUnderResult: 'Under',
    actualSpreadCoveringTeam: 'USC',
    actualWinner: 'USC',
    awayLogoURL: 'https://example.com/away.png',
    awayTeam: 'Florida',
    awayTeamScore: 17,
    bettingOverUnder: 45.5,
    bettingSpread: -3.5,
    homeLogoURL: 'https://example.com/home.png',
    homeTeam: 'USC',
    homeTeamScore: 28,
    myOverUnderPick: 'Over',
    mySpreadPick: 'USC',
    neutralSite: false,
    overUnderGrade: 'Incorrect',
    predictedMargin: 11,
    predictedWinner: 'USC',
    spreadGrade: 'Incorrect',
    winnerGrade: 'Correct',
    ...overrides,
  };
}

function renderBlock(prediction: GamePredictionPublic, props: { showGrades?: boolean; showPredictedScore?: boolean } = {}) {
  return render(
    <MemoryRouter>
      <PredictionScoreBlock prediction={prediction} showGrades {...props} />
    </MemoryRouter>
  );
}

describe('PredictionScoreBlock', () => {
  it('closes the official score dialog when Close is clicked', async () => {
    renderBlock(buildPrediction({ scoreOverrideReason: OVERRIDE_REASON }));

    await userEvent.click(screen.getByRole('button', { name: 'Official score' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not show the official score marker when grades are hidden', () => {
    renderBlock(buildPrediction({ scoreOverrideReason: OVERRIDE_REASON }), { showGrades: false });

    expect(screen.queryByRole('button', { name: 'Official score' })).not.toBeInTheDocument();
  });

  it('does not show the official score marker when the game has no score override', () => {
    renderBlock(buildPrediction({ scoreOverrideReason: null }));

    expect(screen.queryByRole('button', { name: 'Official score' })).not.toBeInTheDocument();
  });

  it('opens a dialog with the official final and the override reason when the marker is clicked', async () => {
    renderBlock(buildPrediction({ scoreOverrideReason: OVERRIDE_REASON }));

    await userEvent.click(screen.getByRole('button', { name: 'Official score' }));

    const dialog = screen.getByRole('dialog', { name: 'Graded on the Official Score' });
    expect(within(dialog).getByText('20-24')).toBeInTheDocument();
    expect(within(dialog).getByText(OVERRIDE_REASON)).toBeInTheDocument();
  });

  it('shows the official score marker when only the final score is displayed', () => {
    renderBlock(buildPrediction({ scoreOverrideReason: OVERRIDE_REASON }), { showPredictedScore: false });

    expect(screen.getByRole('button', { name: 'Official score' })).toBeInTheDocument();
  });
});
