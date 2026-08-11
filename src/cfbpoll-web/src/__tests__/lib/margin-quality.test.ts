import { describe, expect, it } from 'vitest';

import { marginBiasClasses, marginRMSEClasses } from '../../lib/margin-quality';

describe('marginBiasClasses', () => {
  it('classifies a magnitude of exactly 1.5 as green (boundary)', () => {
    expect(marginBiasClasses(1.5)).toContain('bg-green-100');
  });

  it('classifies a magnitude of exactly 3.5 as yellow (boundary)', () => {
    expect(marginBiasClasses(-3.5)).toContain('bg-yellow-100');
  });

  it('classifies a negative value between 1.5 and 3.5 as yellow', () => {
    expect(marginBiasClasses(-2)).toContain('bg-yellow-100');
  });

  it('classifies a negative value beyond 3.5 as red', () => {
    expect(marginBiasClasses(-4.79)).toContain('bg-red-100');
  });

  it('classifies a positive value between 1.5 and 3.5 as yellow', () => {
    expect(marginBiasClasses(2)).toContain('bg-yellow-100');
  });

  it('classifies a positive value beyond 3.5 as red', () => {
    expect(marginBiasClasses(3.51)).toContain('bg-red-100');
  });

  it('classifies zero as green', () => {
    expect(marginBiasClasses(0)).toContain('bg-green-100');
  });

  it('returns null for a null value', () => {
    expect(marginBiasClasses(null)).toBeNull();
  });
});

describe('marginRMSEClasses', () => {
  it('classifies a value above 17.5 as red', () => {
    expect(marginRMSEClasses(18.21)).toContain('bg-red-100');
  });

  it('classifies a value at exactly 16.5 as green (boundary)', () => {
    expect(marginRMSEClasses(16.5)).toContain('bg-green-100');
  });

  it('classifies a value at exactly 17.5 as yellow (boundary)', () => {
    expect(marginRMSEClasses(17.5)).toContain('bg-yellow-100');
  });

  it('classifies a value below 16.5 as green', () => {
    expect(marginRMSEClasses(15.04)).toContain('bg-green-100');
  });

  it('classifies a value between 16.5 and 17.5 as yellow', () => {
    expect(marginRMSEClasses(17.0)).toContain('bg-yellow-100');
  });

  it('returns null for a null value', () => {
    expect(marginRMSEClasses(null)).toBeNull();
  });
});
