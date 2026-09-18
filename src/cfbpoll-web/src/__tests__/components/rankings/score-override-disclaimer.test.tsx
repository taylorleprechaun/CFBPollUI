import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ScoreOverrideDisclaimer } from '../../../components/rankings/score-override-disclaimer';

const iowaOverride = {
  awayTeam: 'Iowa',
  awayTeamLogoURL: 'https://example.com/iowa.png',
  gameID: 401234561,
  homeTeam: 'Nebraska',
  homeTeamLogoURL: 'https://example.com/nebraska.png',
  originalAwayPoints: 20,
  originalHomePoints: 24,
  overrideAwayPoints: 24,
  overrideHomePoints: 20,
  reason: 'A targeting call was missed on the game-deciding play.',
  week: 3,
};

describe('ScoreOverrideDisclaimer', () => {
  it('does not render the modal until the info icon is clicked', () => {
    render(<ScoreOverrideDisclaimer scoreOverrides={[iowaOverride]} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the modal when the info icon is clicked', async () => {
    render(<ScoreOverrideDisclaimer scoreOverrides={[iowaOverride]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Show manually corrected scores' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders nothing when there are no score overrides', () => {
    const { container } = render(<ScoreOverrideDisclaimer scoreOverrides={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the disclaimer label when overrides are present', () => {
    render(<ScoreOverrideDisclaimer scoreOverrides={[iowaOverride]} />);

    expect(screen.getByText('Includes a manually corrected score')).toBeInTheDocument();
  });
});
