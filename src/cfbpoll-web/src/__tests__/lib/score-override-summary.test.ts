import { describe, expect, it } from 'vitest';

import { formatScoreOverrideSummary } from '../../lib/score-override-summary';

describe('formatScoreOverrideSummary', () => {
  it('formats the matchup, week, corrected score, and reason', () => {
    const summary = formatScoreOverrideSummary({
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
    });

    expect(summary).toBe(
      'Iowa @ Nebraska (Week 4): 20-24 corrected to 24-20 - A targeting call was missed on the game-deciding play.'
    );
  });
});
