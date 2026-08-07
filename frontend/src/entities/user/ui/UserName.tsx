import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';
import type { UserSummary } from '../model/types';

interface UserNameProps {
  user: UserSummary | null;

  fallback?: string;

  withEmail?: boolean;

  suffix?: ReactNode;
  className?: string;
}

export function UserName({
  user,
  fallback = '—',
  withEmail = false,
  suffix,
  className,
}: UserNameProps) {
  if (!user) {
    return <span className={cn('text-slate-400', className)}>{fallback}</span>;
  }

  if (!withEmail) {
    return (
      <span className={cn('truncate text-slate-700', className)}>
        {user.name}
        {suffix}
      </span>
    );
  }

  return (
    <span className={cn('flex min-w-0 flex-col', className)}>
      <span className="truncate text-sm font-medium text-slate-900">
        {user.name}
        {suffix}
      </span>
      <span className="truncate text-xs text-slate-500">{user.email}</span>
    </span>
  );
}
