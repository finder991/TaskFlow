import { UserName } from '@/entities/user/@x/task';
import { cn, formatDate, isOverdue } from '@/shared/lib';
import type { Task } from '../model/types';
import { PriorityBadge } from './PriorityBadge';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;

  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'DONE';

  return (
    <article
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all',
        'hover:-translate-y-px hover:border-slate-300 hover:shadow-md',
        isDragging && 'opacity-50',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-slate-900">{task.title}</p>
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <UserName user={task.assignee} fallback="Без виконавця" className="truncate text-xs" />

        <div className="flex shrink-0 items-center gap-2 text-slate-500">
          {task.commentsCount > 0 && (
            <span title={`Коментарів: ${task.commentsCount}`}>💬 {task.commentsCount}</span>
          )}
          {task.dueDate && (
            <span
              className={cn('tabular-nums', overdue && 'font-medium text-red-600')}
              title={overdue ? 'Дедлайн прострочено' : 'Дедлайн'}
            >
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
