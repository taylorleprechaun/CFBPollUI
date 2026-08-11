import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../hooks/use-auth';

export function RequireGuest() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
