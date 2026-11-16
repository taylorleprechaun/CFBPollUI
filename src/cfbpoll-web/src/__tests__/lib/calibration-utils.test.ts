import { describe, expect, it } from 'vitest';

import { calibrationSourceLabel, formatCalibrationSummary, formatCalibrationValue, formatCalibrationVerdict, formatRecordChange, sumRecords, validateCalibrationInput } from '../../lib/calibration-utils';

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

describe('formatCalibrationVerdict', () => {
  const used = { overUnder: { correct: 10, incorrect: 10, push: 0 }, spread: { correct: 10, incorrect: 10, push: 0 }, winner: { correct: 12, incorrect: 8, push: 0 } };

  it('lists the changes in Winner, Spread, O/U order', () => {
    const compared = { overUnder: { correct: 10, incorrect: 10, push: 0 }, spread: { correct: 9, incorrect: 11, push: 0 }, winner: { correct: 13, incorrect: 7, push: 0 } };

    expect(formatCalibrationVerdict({ compared, period: 'Last week', subject: 'your values', used }))
      .toBe('Last week, your values would have changed correct picks by: Winner +1, Spread -1, O/U 0.');
  });

  it('shows gains with a plus sign', () => {
    const compared = { ...used, overUnder: { correct: 8, incorrect: 12, push: 0 }, spread: { correct: 13, incorrect: 7, push: 0 } };

    expect(formatCalibrationVerdict({ compared, period: 'Over the last 4 weeks', subject: 'following the suggestions', used }))
      .toBe('Over the last 4 weeks, following the suggestions would have changed correct picks by: Winner 0, Spread +3, O/U -2.');
  });

});

describe('formatRecordChange', () => {
  it('shows the used and candidate records side by side', () => {
    expect(formatRecordChange({ correct: 24, incorrect: 26, push: 0 }, { correct: 27, incorrect: 22, push: 1 })).toBe('24-26 → 27-22-1');
  });
});

describe('sumRecords', () => {
  it('adds each part of the records together', () => {
    expect(sumRecords([{ correct: 24, incorrect: 26, push: 0 }, { correct: 30, incorrect: 20, push: 2 }])).toEqual({ correct: 54, incorrect: 46, push: 2 });
  });

  it('returns an empty record when there are none', () => {
    expect(sumRecords([])).toEqual({ correct: 0, incorrect: 0, push: 0 });
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
