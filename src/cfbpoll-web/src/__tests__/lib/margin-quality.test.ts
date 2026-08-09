import { describe, expect, it } from 'vitest';

import { marginBiasClasses, marginRMSEClasses } from '../../lib/margin-quality';

describe('marginBiasClasses', () => {
  it('classifies a magnitude of exactly 1 as green (boundary)', () => {
    expect(marginBiasClasses(1)).toContain('bg-green-100');
  });

  it('classifies a magnitude of exactly 3 as yellow (boundary)', () => {
    expect(marginBiasClasses(-3)).toContain('bg-yellow-100');
  });

  it('classifies a negative value between 1 and 3 as yellow', () => {
    expect(marginBiasClasses(-2)).toContain('bg-yellow-100');
  });

  it('classifies a negative value beyond 3 as red', () => {
    expect(marginBiasClasses(-4.79)).toContain('bg-red-100');
  });

  it('classifies a positive value between 1 and 3 as yellow', () => {
    expect(marginBiasClasses(2)).toContain('bg-yellow-100');
  });

  it('classifies a positive value beyond 3 as red', () => {
    expect(marginBiasClasses(3.01)).toContain('bg-red-100');
  });

  it('classifies zero as green', () => {
    expect(marginBiasClasses(0)).toContain('bg-green-100');
  });

  it('returns null for a null value', () => {
    expect(marginBiasClasses(null)).toBeNull();
  });
});

describe('marginRMSEClasses', () => {
  it('classifies a value above 17 as red', () => {
    expect(marginRMSEClasses(18.21)).toContain('bg-red-100');
  });

  it('classifies a value at exactly 15.5 as green (boundary)', () => {
    expect(marginRMSEClasses(15.5)).toContain('bg-green-100');
  });

  it('classifies a value at exactly 17 as yellow (boundary)', () => {
    expect(marginRMSEClasses(17)).toContain('bg-yellow-100');
  });

  it('classifies a value below 15.5 as green', () => {
    expect(marginRMSEClasses(15.04)).toContain('bg-green-100');
  });

  it('classifies a value between 15.5 and 17 as yellow', () => {
    expect(marginRMSEClasses(15.97)).toContain('bg-yellow-100');
  });

  it('returns null for a null value', () => {
    expect(marginRMSEClasses(null)).toBeNull();
  });
});
