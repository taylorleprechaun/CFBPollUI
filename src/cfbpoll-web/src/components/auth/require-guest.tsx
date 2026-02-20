import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';

export function RequireGuest() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
