import { describe, expect, it } from 'vitest';

import type { PredictionStage } from '../../lib/prediction-stage';

import { derivePredictionStage, predictionStageClasses, predictionStageLabel } from '../../lib/prediction-stage';

describe('derivePredictionStage', () => {
  it('returns draft when nothing is published or graded', () => {
    expect(derivePredictionStage({ isGraded: false, isPublished: false, resultsPublished: false })).toBe('draft');
  });

  it('returns graded when graded and picks are published', () => {
    expect(derivePredictionStage({ isGraded: true, isPublished: true, resultsPublished: false })).toBe('graded');
  });

  it('returns graded when graded but picks are not published', () => {
    expect(derivePredictionStage({ isGraded: true, isPublished: false, resultsPublished: false })).toBe('graded');
  });

  it('returns picks-published when published but not graded', () => {
    expect(derivePredictionStage({ isGraded: false, isPublished: true, resultsPublished: false })).toBe('picks-published');
  });

  it('returns results-published even if isGraded/isPublished are inconsistently false', () => {
    expect(derivePredictionStage({ isGraded: false, isPublished: false, resultsPublished: true })).toBe('results-published');
  });

  it('returns results-published when results are published', () => {
    expect(derivePredictionStage({ isGraded: true, isPublished: true, resultsPublished: true })).toBe('results-published');
  });
});

describe('predictionStageClasses', () => {
  it('returns blue classes for graded, not red, since graded is not an error state', () => {
    expect(predictionStageClasses('graded')).toContain('bg-blue-100');
    expect(predictionStageClasses('graded')).not.toContain('bg-red-100');
  });

  it('returns gray classes for draft', () => {
    expect(predictionStageClasses('draft')).toContain('bg-gray-100');
  });

  it('returns green classes for results-published', () => {
    expect(predictionStageClasses('results-published')).toContain('bg-green-100');
  });

  it('returns yellow classes for picks-published', () => {
    expect(predictionStageClasses('picks-published')).toContain('bg-yellow-100');
  });
});

describe('predictionStageLabel', () => {
  const cases: [PredictionStage, string][] = [
    ['draft', 'Draft'],
    ['picks-published', 'Picks Published'],
    ['graded', 'Graded'],
    ['results-published', 'Results Published'],
  ];

  it.each(cases)('returns the correct label for %s', (stage, expected) => {
    expect(predictionStageLabel(stage)).toBe(expected);
  });
});
