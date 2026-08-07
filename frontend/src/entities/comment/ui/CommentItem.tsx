import type { ReactNode } from 'react';
import { formatDateTime } from '@/shared/lib';
import type { Comment } from '../model/types';

interface CommentItemProps {
  comment: Comment;

  actions?: ReactNode;

  children?: ReactNode;
}

export function CommentItem({ comment, actions, children }: CommentItemProps) {
  const edited = comment.updatedAt !== comment.createdAt;

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-medium text-slate-900">
          {comment.author?.name ?? 'Користувач'}
        </span>
        <span className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</span>
        {edited && <span className="text-xs text-slate-400">(змінено)</span>}
        {actions && <span className="ml-auto flex items-center gap-2">{actions}</span>}
      </div>
      {children ?? (
        <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{comment.body}</p>
      )}
    </li>
  );
}
