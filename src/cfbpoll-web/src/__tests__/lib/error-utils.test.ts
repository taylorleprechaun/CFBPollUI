import { describe, it, expect } from 'vitest';
import { toError, toErrorMessage } from '../../lib/error-utils';

describe('toError', () => {
  it('returns the original Error when given an Error instance', () => {
    const original = new Error('something broke');

    const result = toError(original, 'fallback');

    expect(result).toBe(original);
    expect(result.message).toBe('something broke');
  });

  it('returns a new Error with fallback message when given a string', () => {
    const result = toError('not an error', 'fallback message');

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('fallback message');
  });

  it('returns a new Error with fallback message when given null', () => {
    const result = toError(null, 'null fallback');

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('null fallback');
  });

  it('returns a new Error with fallback message when given undefined', () => {
    const result = toError(undefined, 'undefined fallback');

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('undefined fallback');
  });
});

describe('toErrorMessage', () => {
  it('returns the Error message when given an Error instance', () => {
    const result = toErrorMessage(new Error('real message'), 'fallback');

    expect(result).toBe('real message');
  });

  it('returns fallback message when given a non-Error value', () => {
    const result = toErrorMessage({ code: 500 }, 'fallback message');

    expect(result).toBe('fallback message');
  });

  it('returns fallback message when given a number', () => {
    const result = toErrorMessage(42, 'number fallback');

    expect(result).toBe('number fallback');
  });
});
