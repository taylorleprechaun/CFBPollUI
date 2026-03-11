export function toError(err: unknown, fallback: string): Error {
  return err instanceof Error ? err : new Error(fallback);
}

export function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
