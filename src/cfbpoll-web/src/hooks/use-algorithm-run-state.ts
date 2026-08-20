import { type Dispatch, useReducer } from 'react';

import type { AlgorithmVersion } from '../components/admin/algorithm-versions';

import { ALGORITHM_VERSIONS } from '../components/admin/algorithm-versions';

export type AlgorithmRunStatus = 'error' | 'idle' | 'pending' | 'success';

export interface AlgorithmRunEntry<TResult> {
  error: Error | null;
  result: TResult | null;
  status: AlgorithmRunStatus;
}

export type AlgorithmRunState<TResult> = Record<AlgorithmVersion, AlgorithmRunEntry<TResult>>;

export type AlgorithmRunAction<TResult> =
  | { type: 'reset' }
  | { error: Error; type: 'run-error'; version: AlgorithmVersion }
  | { result: TResult; type: 'run-success'; version: AlgorithmVersion }
  | { type: 'run-start'; versions: AlgorithmVersion[] };

export function useAlgorithmRunState<TResult>(): [
  AlgorithmRunState<TResult>,
  Dispatch<AlgorithmRunAction<TResult>>,
] {
  return useReducer(algorithmRunReducer<TResult>, undefined, () => createInitialState<TResult>());
}

function algorithmRunReducer<TResult>(
  state: AlgorithmRunState<TResult>,
  action: AlgorithmRunAction<TResult>
): AlgorithmRunState<TResult> {
  switch (action.type) {
    case 'reset':
      return createInitialState<TResult>();
    case 'run-error':
      return { ...state, [action.version]: { error: action.error, result: null, status: 'error' } };
    case 'run-start': {
      const next = { ...state };
      for (const version of action.versions) {
        next[version] = { error: null, result: null, status: 'pending' };
      }
      return next;
    }
    case 'run-success':
      return { ...state, [action.version]: { error: null, result: action.result, status: 'success' } };
    default:
      return state;
  }
}

function createIdleEntry<TResult>(): AlgorithmRunEntry<TResult> {
  return { error: null, result: null, status: 'idle' };
}

function createInitialState<TResult>(): AlgorithmRunState<TResult> {
  return Object.fromEntries(
    ALGORITHM_VERSIONS.map((version) => [version, createIdleEntry<TResult>()])
  ) as AlgorithmRunState<TResult>;
}
