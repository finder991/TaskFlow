import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSessionStatus } from '@/entities/session';
import { useAcceptInvitation, useInvitationPreview } from '@/features/accept-invitation';
import { ROUTES } from '@/shared/config';
import { Button, FormError, Spinner } from '@/shared/ui';

export function AcceptInvitationPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const sessionStatus = useSessionStatus();

  const preview = useInvitationPreview(token);
  const accept = useAcceptInvitation(token);

  const isAuthenticated = sessionStatus === 'authenticated';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          TaskFlow
        </p>

        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Запрошення до команди
          </h1>

          {preview.isLoading || sessionStatus === 'loading' ? (
            <div className="mt-6 flex justify-center">
              <Spinner className="h-6 w-6 text-brand-600" />
            </div>
          ) : preview.isError ? (
            <p className="mt-4 text-sm text-red-600">Запрошення не знайдено або воно недійсне.</p>
          ) : preview.data ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-slate-600">
                Вас запрошено до простору{' '}
                <span className="font-medium text-slate-900">{preview.data.workspaceName}</span> як{' '}
                <span className="font-medium text-slate-900">{preview.data.email}</span>.
              </p>

              {preview.data.status !== 'PENDING' ? (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Це запрошення вже{' '}
                  {preview.data.status === 'ACCEPTED' ? 'прийнято' : 'недійсне'}.
                </p>
              ) : !isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">
                    Увійдіть під тим самим email, щоб приєднатися.
                  </p>
                  <Link to={ROUTES.login} className="block">
                    <Button className="w-full">Увійти</Button>
                  </Link>
                  <Link
                    to={ROUTES.register}
                    className="block text-sm text-brand-600 hover:underline"
                  >
                    Створити акаунт
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {accept.isError && <FormError error={accept.error} />}
                  <Button
                    className="w-full"
                    isLoading={accept.isPending}
                    onClick={() =>
                      accept.mutate(undefined, {
                        onSuccess: (workspace) => navigate(ROUTES.workspace(workspace.id)),
                      })
                    }
                  >
                    Прийняти запрошення
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
