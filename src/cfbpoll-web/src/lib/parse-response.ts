import type { z } from 'zod';
import { ValidationError } from './api-error';

export async function parseResponse<T>(
  response: Response,
  schema: z.ZodSchema<T>
): Promise<T> {
  const data = await response.json();
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError(result.error);
  }

  return result.data;
}
