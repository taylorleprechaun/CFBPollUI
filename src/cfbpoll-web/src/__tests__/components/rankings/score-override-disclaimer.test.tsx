import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ScoreOverrideDisclaimer } from '../../../components/rankings/score-override-disclaimer';

const iowaOverride = {
  awayTeam: 'Iowa',
  gameID: 401234561,
  homeTeam: 'Nebraska',
  reason: 'A targeting call was missed on the game-deciding play.',
  week: 3,
};

const oklahomaOverride = {
  awayTeam: 'Texas',
  gameID: 401234562,
  homeTeam: 'Oklahoma',
  reason: 'A muffed punt was ruled a fumble recovery that should have been dead.',
  week: 4,
};

describe('ScoreOverrideDisclaimer', () => {
  it('includes every override in the tooltip content when there are several', async () => {
    render(<ScoreOverrideDisclaimer scoreOverrides={[iowaOverride, oklahomaOverride]} />);

    await userEvent.click(screen.getByRole('button', { name: 'About Manual score override' }));

    expect(screen.getByText(/Iowa @ Nebraska/)).toBeInTheDocument();
    expect(screen.getByText(/Texas @ Oklahoma/)).toBeInTheDocument();
  });

  it('renders nothing when there are no score overrides', () => {
    const { container } = render(<ScoreOverrideDisclaimer scoreOverrides={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the disclaimer label when overrides are present', () => {
    render(<ScoreOverrideDisclaimer scoreOverrides={[iowaOverride]} />);

    expect(screen.getByText('Includes a manually corrected score')).toBeInTheDocument();
  });

  it('shows the override reason in the tooltip content when clicked', async () => {
    render(<ScoreOverrideDisclaimer scoreOverrides={[iowaOverride]} />);

    await userEvent.click(screen.getByRole('button', { name: 'About Manual score override' }));

    expect(screen.getByText(/A targeting call was missed on the game-deciding play\./)).toBeInTheDocument();
  });
});
