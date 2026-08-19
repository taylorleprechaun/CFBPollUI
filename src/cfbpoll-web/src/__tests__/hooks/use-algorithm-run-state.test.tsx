import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAlgorithmRunState } from '../../hooks/use-algorithm-run-state';

describe('useAlgorithmRunState', () => {
  it('clears entries back to idle on reset', () => {
    const { result } = renderHook(() => useAlgorithmRunState<string>());

    act(() => {
      result.current[1]({ type: 'run-start', versions: ['V1'] });
      result.current[1]({ result: 'done', type: 'run-success', version: 'V1' });
    });

    act(() => {
      result.current[1]({ type: 'reset' });
    });

    expect(result.current[0].V1).toEqual({ error: null, result: null, status: 'idle' });
  });

  it('initializes every known algorithm version to idle', () => {
    const { result } = renderHook(() => useAlgorithmRunState<string>());

    expect(result.current[0]).toEqual({
      V1: { error: null, result: null, status: 'idle' },
      V2: { error: null, result: null, status: 'idle' },
    });
  });

  it('overwrites a stale success entry back to pending on a fresh run-start', () => {
    const { result } = renderHook(() => useAlgorithmRunState<string>());

    act(() => {
      result.current[1]({ result: 'done', type: 'run-success', version: 'V1' });
    });
    act(() => {
      result.current[1]({ type: 'run-start', versions: ['V1'] });
    });

    expect(result.current[0].V1).toEqual({ error: null, result: null, status: 'pending' });
  });

  it('sets an entry to error status on run-error', () => {
    const { result } = renderHook(() => useAlgorithmRunState<string>());
    const error = new Error('boom');

    act(() => {
      result.current[1]({ error, type: 'run-error', version: 'V2' });
    });

    expect(result.current[0].V2).toEqual({ error, result: null, status: 'error' });
  });

  it('sets an entry to success status with its result on run-success', () => {
    const { result } = renderHook(() => useAlgorithmRunState<string>());

    act(() => {
      result.current[1]({ result: 'rankings-payload', type: 'run-success', version: 'V1' });
    });

    expect(result.current[0].V1).toEqual({ error: null, result: 'rankings-payload', status: 'success' });
  });

  it('sets multiple entries to pending on run-start', () => {
    const { result } = renderHook(() => useAlgorithmRunState<string>());

    act(() => {
      result.current[1]({ type: 'run-start', versions: ['V1', 'V2'] });
    });

    expect(result.current[0].V1.status).toBe('pending');
    expect(result.current[0].V2.status).toBe('pending');
  });
});
