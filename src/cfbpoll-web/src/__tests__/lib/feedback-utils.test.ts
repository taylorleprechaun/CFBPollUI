import { describe, it, expect, vi } from 'vitest';
import { runMutationWithFeedback } from '../../lib/feedback-utils';

describe('runMutationWithFeedback', () => {
  it('clears feedback before calling mutate', async () => {
    const setFeedback = vi.fn();
    const mutate = vi.fn().mockImplementation(async () => {
      expect(setFeedback).toHaveBeenCalledWith(null);
      return undefined;
    });

    await runMutationWithFeedback({
      errorFallback: 'Failed',
      key: 'action-2024-5',
      mutate,
      setFeedback,
    });

    expect(mutate).toHaveBeenCalled();
  });

  it('sets success feedback with no message when successMessage is not provided', async () => {
    const setFeedback = vi.fn();

    await runMutationWithFeedback({
      errorFallback: 'Failed',
      key: 'action-2024-5',
      mutate: async () => undefined,
      setFeedback,
    });

    expect(setFeedback).toHaveBeenLastCalledWith({ key: 'action-2024-5', type: 'success', message: undefined });
  });

  it('sets success feedback with a derived message when successMessage is provided', async () => {
    const setFeedback = vi.fn();

    await runMutationWithFeedback({
      errorFallback: 'Failed',
      key: 'action-2024-5',
      mutate: async () => ({ removedCount: 4 }),
      setFeedback,
      successMessage: (result) => `Removed ${result.removedCount} cached entries`,
    });

    expect(setFeedback).toHaveBeenLastCalledWith({
      key: 'action-2024-5',
      type: 'success',
      message: 'Removed 4 cached entries',
    });
  });

  it('calls onSuccess with the mutation result', async () => {
    const onSuccess = vi.fn();
    const result = { season: 2024, week: 5 };

    await runMutationWithFeedback({
      errorFallback: 'Failed',
      key: 'action-2024-5',
      mutate: async () => result,
      onSuccess,
      setFeedback: vi.fn(),
    });

    expect(onSuccess).toHaveBeenCalledWith(result);
  });

  it('sets error feedback with the error message on failure', async () => {
    const setFeedback = vi.fn();

    await runMutationWithFeedback({
      errorFallback: 'Fallback message',
      key: 'action-2024-5',
      mutate: async () => {
        throw new Error('Server error');
      },
      setFeedback,
    });

    expect(setFeedback).toHaveBeenLastCalledWith({
      key: 'action-2024-5',
      type: 'error',
      message: 'Server error',
    });
  });

  it('sets error feedback with the fallback message when the thrown value is not an Error', async () => {
    const setFeedback = vi.fn();

    await runMutationWithFeedback({
      errorFallback: 'Fallback message',
      key: 'action-2024-5',
      mutate: async () => {
        throw 'not an error';
      },
      setFeedback,
    });

    expect(setFeedback).toHaveBeenLastCalledWith({
      key: 'action-2024-5',
      type: 'error',
      message: 'Fallback message',
    });
  });

  it('does not call onSuccess when the mutation fails', async () => {
    const onSuccess = vi.fn();

    await runMutationWithFeedback({
      errorFallback: 'Failed',
      key: 'action-2024-5',
      mutate: async () => {
        throw new Error('boom');
      },
      onSuccess,
      setFeedback: vi.fn(),
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
