import { describe, expect, it } from 'vitest';

import { gradeClasses } from '../../lib/grade-classes';

describe('gradeClasses', () => {
  it('returns green classes for Correct', () => {
    expect(gradeClasses('Correct')).toContain('bg-green-100');
  });

  it('returns red classes for Incorrect', () => {
    expect(gradeClasses('Incorrect')).toContain('bg-red-100');
  });

  it('returns gray classes for Push', () => {
    expect(gradeClasses('Push')).toContain('bg-gray-100');
  });

  it('returns a gray fallback for Ungraded', () => {
    expect(gradeClasses('Ungraded')).toContain('bg-gray-100');
  });

  it('returns a gray fallback for NotApplicable', () => {
    expect(gradeClasses('NotApplicable')).toContain('bg-gray-100');
  });

  it('uses a distinct gray shade for the fallback than for Push', () => {
    expect(gradeClasses('Ungraded')).not.toBe(gradeClasses('Push'));
  });
});
