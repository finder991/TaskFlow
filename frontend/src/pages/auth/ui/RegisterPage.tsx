import { Link, Navigate } from 'react-router-dom';
import { useSessionStatus } from '@/entities/session';
import { RegisterForm } from '@/features/auth';
import { ROUTES } from '@/shared/config';
import { AuthLayout } from './AuthLayout';

export function RegisterPage() {
  const status = useSessionStatus();

  if (status === 'authenticated') {
    return <Navigate to={ROUTES.workspaces} replace />;
  }

  return (
    <AuthLayout
      title="Реєстрація"
      subtitle="Створіть акаунт, щоб працювати з командою"
      footer={
        <>
          Вже є акаунт?{' '}
          <Link to={ROUTES.login} className="font-medium text-brand-600 hover:underline">
            Увійти
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
