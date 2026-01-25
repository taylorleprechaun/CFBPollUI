import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorAlert } from '../../components/error/error-alert';
import { ApiError, ValidationError } from '../../lib/api-error';
import { ZodError } from 'zod';

describe('ErrorAlert', () => {
  describe('with generic Error', () => {
    it('renders error message', () => {
      const error = new Error('Something went wrong');
      render(<ErrorAlert error={error} />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders default message for error without message', () => {
      const error = new Error();
      render(<ErrorAlert error={error} />);

      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  describe('with ApiError', () => {
    it('renders connection error for network failures', () => {
      const error = new ApiError('Network error', 0);
      render(<ErrorAlert error={error} />);

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(
        screen.getByText(/Unable to connect to the server/)
      ).toBeInTheDocument();
    });

    it('renders server error for 5xx responses', () => {
      const error = new ApiError('Internal server error', 500, 'trace-123');
      render(<ErrorAlert error={error} />);

      expect(screen.getByText('Server Error')).toBeInTheDocument();
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
      expect(screen.getByText('Trace ID: trace-123')).toBeInTheDocument();
    });

    it('renders request failed for client errors', () => {
      const error = new ApiError('Bad request', 400, 'trace-456');
      render(<ErrorAlert error={error} />);

      expect(screen.getByText('Request Failed')).toBeInTheDocument();
      expect(screen.getByText('Bad request')).toBeInTheDocument();
      expect(screen.getByText('Trace ID: trace-456')).toBeInTheDocument();
    });

    it('does not show trace ID for network errors', () => {
      const error = new ApiError('Network error', 0, 'trace-789');
      render(<ErrorAlert error={error} />);

      expect(screen.queryByText(/Trace ID/)).not.toBeInTheDocument();
    });
  });

  describe('with ValidationError', () => {
    it('renders data error message', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'number',
          received: 'string',
          path: ['field'],
          message: 'Expected number',
        },
      ]);
      const error = new ValidationError(zodError);
      render(<ErrorAlert error={error} />);

      expect(screen.getByText('Data Error')).toBeInTheDocument();
      expect(
        screen.getByText('The server returned unexpected data.')
      ).toBeInTheDocument();
    });
  });

  describe('retry functionality', () => {
    it('shows retry button when onRetry is provided', () => {
      const error = new Error('Test error');
      const onRetry = vi.fn();
      render(<ErrorAlert error={error} onRetry={onRetry} />);

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('does not show retry button when onRetry is not provided', () => {
      const error = new Error('Test error');
      render(<ErrorAlert error={error} />);

      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const error = new Error('Test error');
      const onRetry = vi.fn();
      render(<ErrorAlert error={error} onRetry={onRetry} />);

      fireEvent.click(screen.getByText('Retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
