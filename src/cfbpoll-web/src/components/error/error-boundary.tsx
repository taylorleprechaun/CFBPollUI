import { type ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { BUTTON_PRIMARY } from '../ui/button-styles';
import { WarningTriangleIcon } from '../ui/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

function DefaultFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';

  return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg p-4">
      <div className="max-w-md w-full bg-surface shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <WarningTriangleIcon className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary text-center mb-2">
          Something went wrong
        </h2>
        <p className="text-text-secondary text-center mb-4">
          {message}
        </p>
        <button
          onClick={resetErrorBoundary}
          className={`${BUTTON_PRIMARY} w-full`}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function handleError(error: unknown, info: { componentStack?: string | null }) {
  console.error('ErrorBoundary caught an error:', error, info);
}

export function ErrorBoundary({ children, fallback }: Props) {
  if (fallback) {
    return (
      <ReactErrorBoundary fallbackRender={() => <>{fallback}</>} onError={handleError}>
        {children}
      </ReactErrorBoundary>
    );
  }

  return (
    <ReactErrorBoundary FallbackComponent={DefaultFallback} onError={handleError}>
      {children}
    </ReactErrorBoundary>
  );
}
