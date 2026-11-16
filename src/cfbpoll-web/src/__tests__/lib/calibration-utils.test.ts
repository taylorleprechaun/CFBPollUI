import { describe, expect, it } from 'vitest';

import {
  CALIBRATION_RECORDS,
  calibrationPageUrl,
  calibrationSourceLabel,
  formatCalibrationSummary,
  formatCalibrationValue,
  formatCalibrationVerdict,
  formatRecordChange,
  formatSignedNumber,
  recordDifference,
  validateCalibrationInput,
} from '../../lib/calibration-utils';

const parameter = { defaultValue: 0, description: '', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 };

describe('CALIBRATION_RECORDS', () => {
  it('lists the records in Winner, Spread, O/U order', () => {
    expect(CALIBRATION_RECORDS.map((r) => r.label)).toEqual(['Winner', 'Spread', 'O/U']);
  });
});

describe('calibrationPageUrl', () => {
  it('links to a season and week', () => {
    expect(calibrationPageUrl(2026, 10)).toBe('/admin/calibration?season=2026&week=10');
  });

  it('links to a season alone when no week is given', () => {
    expect(calibrationPageUrl(2026)).toBe('/admin/calibration?season=2026');
  });
});

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

describe('formatSignedNumber', () => {
  it('adds a plus sign to positive numbers only', () => {
    expect(formatSignedNumber(3)).toBe('+3');
    expect(formatSignedNumber(0)).toBe('0');
    expect(formatSignedNumber(-2)).toBe('-2');
  });
});

describe('recordDifference', () => {
  it('counts how many more picks the compared record got right', () => {
    expect(recordDifference({ correct: 24, incorrect: 26, push: 0 }, { correct: 27, incorrect: 23, push: 0 })).toBe(3);
  });

  it('is negative when the compared record got fewer right', () => {
    expect(recordDifference({ correct: 24, incorrect: 26, push: 0 }, { correct: 22, incorrect: 28, push: 0 })).toBe(-2);
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
