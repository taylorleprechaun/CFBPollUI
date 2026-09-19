import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ScoreOverrideModal } from '../../../components/rankings/score-override-modal';

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

const oklahomaOverride = {
  awayTeam: 'Texas',
  awayTeamLogoURL: 'https://example.com/texas.png',
  gameID: 401234562,
  homeTeam: 'Oklahoma',
  homeTeamLogoURL: 'https://example.com/oklahoma.png',
  originalAwayPoints: 17,
  originalHomePoints: 21,
  overrideAwayPoints: 21,
  overrideHomePoints: 17,
  reason: 'A muffed punt was ruled a fumble recovery that should have been dead.',
  week: 4,
};

describe('ScoreOverrideModal', () => {
  it('calls onClose on Escape', async () => {
    const onClose = vi.fn();
    render(<ScoreOverrideModal onClose={onClose} scoreOverrides={[iowaOverride]} />);

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Close is clicked', async () => {
    const onClose = vi.fn();
    render(<ScoreOverrideModal onClose={onClose} scoreOverrides={[iowaOverride]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('lists every override when there are several', () => {
    render(<ScoreOverrideModal onClose={vi.fn()} scoreOverrides={[iowaOverride, oklahomaOverride]} />);

    expect(screen.getByText('Iowa')).toBeInTheDocument();
    expect(screen.getByText('Nebraska')).toBeInTheDocument();
    expect(screen.getByText('Texas')).toBeInTheDocument();
    expect(screen.getByText('Oklahoma')).toBeInTheDocument();
  });

  it('renders a fallback initial when a team has no logo URL', () => {
    const overrideWithoutLogos = { ...iowaOverride, awayTeamLogoURL: null, homeTeamLogoURL: null };
    render(<ScoreOverrideModal onClose={vi.fn()} scoreOverrides={[overrideWithoutLogos]} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders team logos for both teams', () => {
    render(<ScoreOverrideModal onClose={vi.fn()} scoreOverrides={[iowaOverride]} />);

    expect(screen.getByRole('img', { name: 'Iowa logo' })).toHaveAttribute('src', 'https://example.com/iowa.png');
    expect(screen.getByRole('img', { name: 'Nebraska logo' })).toHaveAttribute('src', 'https://example.com/nebraska.png');
  });

  it('shows Postseason as the week label for a postseason override', () => {
    render(<ScoreOverrideModal onClose={vi.fn()} scoreOverrides={[{ ...iowaOverride, seasonType: 'postseason', week: 1 }]} />);

    expect(screen.getByText('Postseason')).toBeInTheDocument();
  });

  it('shows the corrected score alongside the original score', () => {
    render(<ScoreOverrideModal onClose={vi.fn()} scoreOverrides={[iowaOverride]} />);

    expect(screen.getByText(/20-24.*24-20/)).toBeInTheDocument();
  });

  it('shows the override reason', () => {
    render(<ScoreOverrideModal onClose={vi.fn()} scoreOverrides={[iowaOverride]} />);

    expect(screen.getByText('A targeting call was missed on the game-deciding play.')).toBeInTheDocument();
  });

  it('shows the week label', () => {
    render(<ScoreOverrideModal onClose={vi.fn()} scoreOverrides={[iowaOverride]} />);

    expect(screen.getByText('Week 3')).toBeInTheDocument();
  });
});
