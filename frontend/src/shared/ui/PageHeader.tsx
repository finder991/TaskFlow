import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string | null;

  backTo?: { href: string; label: string };
  actions?: ReactNode;
  meta?: ReactNode;
}

export function PageHeader({ title, description, backTo, actions, meta }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {backTo && (
        <Link
          to={backTo.href}
          className="text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          ← {backTo.label}
        </Link>
      )}
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            {meta}
          </div>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
