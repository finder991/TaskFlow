import { Link, Navigate } from 'react-router-dom';
import { useSessionStatus } from '@/entities/session';
import { LoginForm } from '@/features/auth';
import { ROUTES } from '@/shared/config';
import { AuthLayout } from './AuthLayout';

export function LoginPage() {
  const status = useSessionStatus();

  if (status === 'authenticated') {
    return <Navigate to={ROUTES.workspaces} replace />;
  }

  return (
    <AuthLayout
      title="Вхід"
      subtitle="Введіть свої дані, щоб продовжити"
      footer={
        <>
          Немає акаунта?{' '}
          <Link to={ROUTES.register} className="font-medium text-brand-600 hover:underline">
            Зареєструватися
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
