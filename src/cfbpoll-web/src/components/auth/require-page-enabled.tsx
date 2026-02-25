import { Navigate } from 'react-router-dom';
import { usePageVisibility } from '../../hooks/use-page-visibility';

interface RequirePageEnabledProps {
  children: React.ReactNode;
  enabled: boolean;
}

export function RequirePageEnabled({ children, enabled }: RequirePageEnabledProps) {
  const { isLoading } = usePageVisibility();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!enabled) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
