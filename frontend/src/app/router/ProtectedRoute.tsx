import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessionStatus } from '@/entities/session';
import { ROUTES } from '@/shared/config';
import { LoadingState } from '@/shared/ui';

export function ProtectedRoute() {
  const status = useSessionStatus();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingState label="Перевірка сесії…" />;
  }

  if (status === 'anonymous') {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
