import { describe, expect, it } from 'vitest';

import { calibrationSourceLabel, formatCalibrationSummary, formatCalibrationValue, validateCalibrationInput } from '../../lib/calibration-utils';

const parameter = { defaultValue: 0, description: '', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 };

describe('calibrationSourceLabel', () => {
  it('labels accepted and manual values', () => {
    expect(calibrationSourceLabel({ carriedFromSeason: null, carriedFromWeek: null, source: 'Accepted' })).toBe('Accepted suggestion');
    expect(calibrationSourceLabel({ carriedFromSeason: null, carriedFromWeek: null, source: 'Manual' })).toBe('Set manually');
  });

  it('names the week carried-forward values came from', () => {
    expect(calibrationSourceLabel({ carriedFromSeason: 2026, carriedFromWeek: 11, source: 'CarriedForward' }))
      .toBe('Carried forward from 2026 Week 12');
  });

  it('notes carried-forward values that are not saved yet', () => {
    expect(calibrationSourceLabel({ carriedFromSeason: 2026, carriedFromWeek: 11, isStored: false, source: 'CarriedForward' }))
      .toBe('Carried forward from 2026 Week 12, not saved yet');
  });

  it('returns Unknown for a null source', () => {
    expect(calibrationSourceLabel({ carriedFromSeason: null, carriedFromWeek: null, source: null })).toBe('Unknown');
  });

  it('says defaults when nothing earlier was saved', () => {
    expect(calibrationSourceLabel({ carriedFromSeason: null, carriedFromWeek: null, source: 'CarriedForward' }))
      .toBe('Defaults (nothing saved earlier)');
  });
});

describe('formatCalibrationSummary', () => {
  it('falls back to the default for a missing value', () => {
    expect(formatCalibrationSummary([parameter], {})).toBe('Param A 0');
  });

  it('lists each parameter with its formatted value', () => {
    const second = { ...parameter, key: 'paramB', label: 'Param B' };

    expect(formatCalibrationSummary([parameter, second], { paramA: 2, paramB: -1.5 })).toBe('Param A +2 · Param B -1.5');
  });
});

describe('formatCalibrationValue', () => {
  it('formats negative values without a plus sign', () => {
    expect(formatCalibrationValue(-1.25)).toBe('-1.25');
  });

  it('formats positive values with a plus sign', () => {
    expect(formatCalibrationValue(1.5)).toBe('+1.5');
  });

  it('formats zero without a sign', () => {
    expect(formatCalibrationValue(0)).toBe('0');
  });

  it('returns a dash for a missing value', () => {
    expect(formatCalibrationValue(undefined)).toBe('-');
  });

  it('rounds to two decimals', () => {
    expect(formatCalibrationValue(1.23456)).toBe('+1.23');
  });
});

describe('validateCalibrationInput', () => {
  it('accepts a value at the range boundary', () => {
    expect(validateCalibrationInput('-5', parameter)).toBeNull();
    expect(validateCalibrationInput('5', parameter)).toBeNull();
  });

  it('rejects a blank value', () => {
    expect(validateCalibrationInput('  ', parameter)).toBe('A value is required');
  });

  it('rejects a non-numeric value', () => {
    expect(validateCalibrationInput('abc', parameter)).toBe('Enter a number');
  });

  it('rejects a value outside the range', () => {
    expect(validateCalibrationInput('5.1', parameter)).toBe('Must be between -5 and 5');
  });
});
