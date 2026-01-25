import { type ZodError, type ZodIssue } from 'zod';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly traceId?: string;

  constructor(message: string, statusCode: number, traceId?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.traceId = traceId;
  }

  static fromResponse(response: Response, body?: { message?: string; traceId?: string }): ApiError {
    const message = body?.message || `Request failed with status ${response.status}`;
    return new ApiError(message, response.status, body?.traceId);
  }

  get isNetworkError(): boolean {
    return this.statusCode === 0;
  }

  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

export class ValidationError extends Error {
  public readonly errors: ZodIssue[];

  constructor(zodError: ZodError<unknown>) {
    const message = `Validation failed: ${zodError.issues.map((e) => e.message).join(', ')}`;
    super(message);
    this.name = 'ValidationError';
    this.errors = zodError.issues;
  }
}
