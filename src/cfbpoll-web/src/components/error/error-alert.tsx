import { ApiError, ValidationError } from '../../lib/api-error';

interface ErrorAlertProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorAlert({ error, onRetry }: ErrorAlertProps) {
  const getErrorDetails = () => {
    if (error instanceof ApiError) {
      if (error.isNetworkError) {
        return {
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your internet connection.',
          showTraceId: false,
        };
      }
      if (error.isServerError) {
        return {
          title: 'Server Error',
          message: error.message,
          showTraceId: true,
        };
      }
      return {
        title: 'Request Failed',
        message: error.message,
        showTraceId: true,
      };
    }

    if (error instanceof ValidationError) {
      return {
        title: 'Data Error',
        message: 'The server returned unexpected data.',
        showTraceId: false,
      };
    }

    return {
      title: 'Error',
      message: error.message || 'An unexpected error occurred',
      showTraceId: false,
    };
  };

  const { title, message, showTraceId } = getErrorDetails();
  const traceId = error instanceof ApiError ? error.traceId : undefined;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          {showTraceId && traceId && (
            <p className="mt-1 text-xs text-red-500">Trace ID: {traceId}</p>
          )}
        </div>
        {onRetry && (
          <div className="ml-4">
            <button
              onClick={onRetry}
              className="text-sm font-medium text-red-800 hover:text-red-600 underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
