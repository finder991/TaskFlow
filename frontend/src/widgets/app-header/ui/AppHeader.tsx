import { Link } from 'react-router-dom';
import { useCurrentUser } from '@/entities/session';
import { LogoutButton } from '@/features/auth';
import { ROUTES } from '@/shared/config';

export function AppHeader() {
  const user = useCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          to={ROUTES.workspaces}
          className="text-base font-semibold tracking-tight text-slate-900"
        >
          TaskFlow
        </Link>

        {user && (
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
