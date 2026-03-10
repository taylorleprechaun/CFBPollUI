import { describe, it, expect } from 'vitest';

import { isActiveLink } from '../../lib/route-utils';

describe('isActiveLink', () => {
  it('returns true for exact root match', () => {
    expect(isActiveLink('/', '/')).toBe(true);
  });

  it('returns false for root link when pathname is not root', () => {
    expect(isActiveLink('/rankings', '/')).toBe(false);
  });

  it('returns true when pathname starts with linkTo', () => {
    expect(isActiveLink('/rankings/2024', '/rankings')).toBe(true);
  });

  it('returns true for exact non-root match', () => {
    expect(isActiveLink('/rankings', '/rankings')).toBe(true);
  });

  it('returns false when pathname does not start with linkTo', () => {
    expect(isActiveLink('/admin', '/rankings')).toBe(false);
  });
});
