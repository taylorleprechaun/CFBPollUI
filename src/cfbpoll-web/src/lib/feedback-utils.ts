import type { ActionFeedback } from '../components/admin';
import { toErrorMessage } from './error-utils';

interface RunMutationWithFeedbackOptions<TResult> {
  errorFallback: string;
  key: string;
  mutate: () => Promise<TResult>;
  onSuccess?: (result: TResult) => void;
  setFeedback: (feedback: ActionFeedback | null) => void;
  successMessage?: (result: TResult) => string | undefined;
}

export async function runMutationWithFeedback<TResult>({
  errorFallback,
  key,
  mutate,
  onSuccess,
  setFeedback,
  successMessage,
}: RunMutationWithFeedbackOptions<TResult>): Promise<void> {
  setFeedback(null);

  try {
    const result = await mutate();
    onSuccess?.(result);
    setFeedback({ key, type: 'success', message: successMessage?.(result) });
  } catch (err) {
    setFeedback({ key, type: 'error', message: toErrorMessage(err, errorFallback) });
  }
}
