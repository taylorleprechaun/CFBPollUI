import { describe, expect, it } from 'vitest';

import {
  CALIBRATION_RECORDS,
  calibrationPageUrl,
  calibrationSourceLabel,
  describeNoise,
  formatBaselineVerdict,
  formatCalibrationSummary,
  formatCalibrationValue,
  formatCalibrationVerdict,
  formatNoiseVerdict,
  formatPickChange,
  formatRecordChange,
  formatSignedNumber,
  isWithinNoise,
  recordDifference,
  signTestPValue,
  sumPickChanges,
  validateCalibrationInput,
} from '../../lib/calibration-utils';

const parameter = { defaultValue: 0, description: '', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 };
const noChange = { changed: 0, comparedCorrect: 0, usedCorrect: 0 };
const evenSplit = { changed: 10, comparedCorrect: 6, usedCorrect: 4 };
const lopsidedSplit = { changed: 10, comparedCorrect: 10, usedCorrect: 0 };

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

describe('describeNoise', () => {
  it('calls a lopsided split unlikely to be luck', () => {
    expect(describeNoise(lopsidedSplit)).toBe('unlikely to be luck alone');
  });

  it('calls an even split within noise', () => {
    expect(describeNoise(evenSplit)).toBe('within noise');
  });
});

describe('formatBaselineVerdict', () => {
  it('compares the values used with no calibration in Winner, Spread, O/U order', () => {
    const baseline = { overUnder: { correct: 10, incorrect: 10, push: 0 }, spread: { correct: 8, incorrect: 12, push: 0 }, winner: { correct: 12, incorrect: 8, push: 0 } };
    const used = { overUnder: { correct: 11, incorrect: 9, push: 0 }, spread: { correct: 12, incorrect: 8, push: 0 }, winner: { correct: 12, incorrect: 8, push: 0 } };

    expect(formatBaselineVerdict({ baseline, period: 'So far this season', used }))
      .toBe('So far this season, compared with no calibration, the values used changed correct picks by: Winner 0, Spread +4, O/U +1.');
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

describe('formatNoiseVerdict', () => {
  it('names a single record that is beyond noise', () => {
    expect(formatNoiseVerdict({ overUnder: evenSplit, spread: lopsidedSplit, winner: noChange })).toBe('The Spread difference is unlikely to be luck alone.');
  });

  it('names several records beyond noise in Winner, Spread, O/U order', () => {
    expect(formatNoiseVerdict({ overUnder: lopsidedSplit, spread: lopsidedSplit, winner: lopsidedSplit })).toBe('The Winner, Spread and O/U differences are unlikely to be luck alone.');
  });

  it('says when every difference is within noise', () => {
    expect(formatNoiseVerdict({ overUnder: evenSplit, spread: evenSplit, winner: noChange })).toBe('All of these differences are within what luck alone would produce.');
  });

  it('says when no picks changed', () => {
    expect(formatNoiseVerdict({ overUnder: noChange, spread: noChange, winner: noChange })).toBe('No picks changed.');
  });
});

describe('formatPickChange', () => {
  it('counts changed picks and how they split, compared side first', () => {
    expect(formatPickChange({ changed: 7, comparedCorrect: 5, usedCorrect: 2 })).toBe('7 picks changed, 5-2');
  });

  it('says when no picks changed', () => {
    expect(formatPickChange(noChange)).toBe('No picks changed');
  });

  it('uses the singular for one pick', () => {
    expect(formatPickChange({ changed: 1, comparedCorrect: 0, usedCorrect: 1 })).toBe('1 pick changed, 0-1');
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

describe('isWithinNoise', () => {
  it('is false for a split too uneven to be luck', () => {
    expect(isWithinNoise(lopsidedSplit)).toBe(false);
  });

  it('is true for an even split', () => {
    expect(isWithinNoise(evenSplit)).toBe(true);
  });

  it('is true for five or fewer decided picks, however they split', () => {
    expect(isWithinNoise({ changed: 5, comparedCorrect: 5, usedCorrect: 0 })).toBe(true);
  });

  it('leaves pushes out of the test', () => {
    expect(isWithinNoise({ changed: 12, comparedCorrect: 6, usedCorrect: 0 })).toBe(false);
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

describe('signTestPValue', () => {
  it('is 1 for a perfectly even split', () => {
    expect(signTestPValue(5, 5)).toBe(1);
  });

  it('is 1 when nothing was decided', () => {
    expect(signTestPValue(0, 0)).toBe(1);
  });

  it('matches the exact two-sided binomial tail', () => {
    expect(signTestPValue(8, 2)).toBeCloseTo(0.109375, 6);
    expect(signTestPValue(2, 8)).toBeCloseTo(0.109375, 6);
    expect(signTestPValue(6, 0)).toBeCloseTo(0.03125, 6);
  });
});

describe('sumPickChanges', () => {
  it('adds up changed picks across weeks', () => {
    expect(sumPickChanges([{ changed: 3, comparedCorrect: 2, usedCorrect: 1 }, { changed: 4, comparedCorrect: 1, usedCorrect: 2 }]))
      .toEqual({ changed: 7, comparedCorrect: 3, usedCorrect: 3 });
  });

  it('is all zeros for no weeks', () => {
    expect(sumPickChanges([])).toEqual(noChange);
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
