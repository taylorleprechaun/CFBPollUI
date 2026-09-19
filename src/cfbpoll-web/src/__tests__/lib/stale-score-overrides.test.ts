import { describe, expect, it } from 'vitest';

import { formatStaleScoreOverride, getStaleScoreOverrideKindLabel } from '../../lib/stale-score-overrides';

describe('stale-score-overrides', () => {
  describe('formatStaleScoreOverride', () => {
    it('formats the matchup with how its override differs', () => {
      expect(
        formatStaleScoreOverride({ awayTeam: 'Iowa', gameID: 1, homeTeam: 'Nebraska', kind: 'Added' })
      ).toBe('Iowa @ Nebraska (Added since calculation)');
    });
  });

  describe('getStaleScoreOverrideKindLabel', () => {
    it('labels every kind', () => {
      expect(getStaleScoreOverrideKindLabel('Added')).toBe('Added since calculation');
      expect(getStaleScoreOverrideKindLabel('Changed')).toBe('Score changed since calculation');
      expect(getStaleScoreOverrideKindLabel('Removed')).toBe('Removed since calculation');
    });
  });
});
