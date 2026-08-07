import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingState } from '@/shared/ui';
import { AppLayout } from './AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

const AcceptInvitationPage = lazy(() =>
  import('@/pages/invitation').then((module) => ({
    default: module.AcceptInvitationPage,
  })),
);
const BoardPage = lazy(() =>
  import('@/pages/board').then((module) => ({ default: module.BoardPage })),
);
const LoginPage = lazy(() =>
  import('@/pages/auth').then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/pages/auth').then((module) => ({ default: module.RegisterPage })),
);
const WorkspacePage = lazy(() =>
  import('@/pages/workspace').then((module) => ({ default: module.WorkspacePage })),
);
const WorkspacesPage = lazy(() =>
  import('@/pages/workspaces').then((module) => ({
    default: module.WorkspacesPage,
  })),
);

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingState label="Завантажуємо сторінку…" />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/invitations/:token" element={<AcceptInvitationPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<WorkspacesPage />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
            <Route path="/projects/:projectId" element={<BoardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
