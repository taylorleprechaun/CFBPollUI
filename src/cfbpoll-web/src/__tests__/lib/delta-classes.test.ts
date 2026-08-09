import { describe, expect, it } from 'vitest';

import { deltaClasses } from '../../lib/delta-classes';

describe('deltaClasses', () => {
  it('returns green classes for a delta of -1', () => {
    expect(deltaClasses(-1)).toContain('bg-green-100');
  });

  it('returns green classes for a delta of 0', () => {
    expect(deltaClasses(0)).toContain('bg-green-100');
  });

  it('returns green classes for a delta of 1', () => {
    expect(deltaClasses(1)).toContain('bg-green-100');
  });

  it('returns red classes for a delta of -4', () => {
    expect(deltaClasses(-4)).toContain('bg-red-100');
  });

  it('returns red classes for a delta of 4', () => {
    expect(deltaClasses(4)).toContain('bg-red-100');
  });

  it('returns red classes for large magnitude deltas', () => {
    expect(deltaClasses(9)).toContain('bg-red-100');
  });

  it('returns yellow classes for a delta of -3', () => {
    expect(deltaClasses(-3)).toContain('bg-yellow-100');
  });

  it('returns yellow classes for a delta of 2', () => {
    expect(deltaClasses(2)).toContain('bg-yellow-100');
  });
});
