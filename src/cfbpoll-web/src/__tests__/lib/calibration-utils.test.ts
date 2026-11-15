import { describe, expect, it } from 'vitest';

import { calibrationSourceLabel, formatCalibrationValue, validateCalibrationInput } from '../../lib/calibration-utils';

const parameter = { defaultValue: 0, description: '', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 };

describe('calibrationSourceLabel', () => {
  it('labels each stored source', () => {
    expect(calibrationSourceLabel('Accepted')).toBe('Accepted suggestion');
    expect(calibrationSourceLabel('CarriedForward')).toBe('Carried forward');
    expect(calibrationSourceLabel('Manual')).toBe('Set manually');
  });

  it('returns Unknown for a null source', () => {
    expect(calibrationSourceLabel(null)).toBe('Unknown');
  });

  it('says not saved yet when the values are not stored', () => {
    expect(calibrationSourceLabel('CarriedForward', false)).toBe('Carried forward (not saved yet)');
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
