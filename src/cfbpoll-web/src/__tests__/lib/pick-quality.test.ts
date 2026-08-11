import { describe, expect, it } from 'vitest';

import { overUnderClasses, spreadClasses, winnerClasses } from '../../lib/pick-quality';

describe('overUnderClasses', () => {
  it('classifies a rate above 52 as green', () => {
    expect(overUnderClasses({ correct: 60, incorrect: 40, push: 0 })).toContain('bg-green-100');
  });

  it('classifies a rate at exactly 49 as yellow (boundary)', () => {
    expect(overUnderClasses({ correct: 49, incorrect: 51, push: 0 })).toContain('bg-yellow-100');
  });

  it('classifies a rate at exactly 52 as green (boundary)', () => {
    expect(overUnderClasses({ correct: 52, incorrect: 48, push: 0 })).toContain('bg-green-100');
  });

  it('classifies a rate below 49 as red', () => {
    expect(overUnderClasses({ correct: 48, incorrect: 52, push: 0 })).toContain('bg-red-100');
  });

  it('classifies a rate between 49 and 52 as yellow', () => {
    expect(overUnderClasses({ correct: 50, incorrect: 50, push: 0 })).toContain('bg-yellow-100');
  });

  it('returns null when there are no decided games', () => {
    expect(overUnderClasses({ correct: 0, incorrect: 0, push: 5 })).toBeNull();
  });
});

describe('spreadClasses', () => {
  it('classifies a rate above 51 as green', () => {
    expect(spreadClasses({ correct: 60, incorrect: 40, push: 0 })).toContain('bg-green-100');
  });

  it('classifies a rate at exactly 48 as yellow (boundary)', () => {
    expect(spreadClasses({ correct: 48, incorrect: 52, push: 0 })).toContain('bg-yellow-100');
  });

  it('classifies a rate at exactly 51 as green (boundary)', () => {
    expect(spreadClasses({ correct: 51, incorrect: 49, push: 0 })).toContain('bg-green-100');
  });

  it('classifies a rate below 48 as red', () => {
    expect(spreadClasses({ correct: 47, incorrect: 53, push: 0 })).toContain('bg-red-100');
  });

  it('classifies a rate between 48 and 51 as yellow', () => {
    expect(spreadClasses({ correct: 50, incorrect: 50, push: 0 })).toContain('bg-yellow-100');
  });

  it('returns null when there are no decided games', () => {
    expect(spreadClasses({ correct: 0, incorrect: 0, push: 5 })).toBeNull();
  });
});

describe('winnerClasses', () => {
  it('classifies a rate above 70 as green', () => {
    expect(winnerClasses({ correct: 8, incorrect: 2, push: 0 })).toContain('bg-green-100');
  });

  it('classifies a rate at exactly 65 as yellow (boundary)', () => {
    expect(winnerClasses({ correct: 13, incorrect: 7, push: 0 })).toContain('bg-yellow-100');
  });

  it('classifies a rate at exactly 70 as green (boundary)', () => {
    expect(winnerClasses({ correct: 7, incorrect: 3, push: 0 })).toContain('bg-green-100');
  });

  it('classifies a rate below 65 as red', () => {
    expect(winnerClasses({ correct: 6, incorrect: 4, push: 0 })).toContain('bg-red-100');
  });

  it('classifies a rate between 65 and 70 as yellow', () => {
    expect(winnerClasses({ correct: 67, incorrect: 33, push: 0 })).toContain('bg-yellow-100');
  });

  it('returns null when there are no decided games', () => {
    expect(winnerClasses({ correct: 0, incorrect: 0, push: 5 })).toBeNull();
  });
});
